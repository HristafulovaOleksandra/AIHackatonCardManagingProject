using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HackathonGame.CardsService.Data;
using HackathonGame.CardsService.DTOs;
using HackathonGame.CardsService.Models;

namespace HackathonGame.CardsService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HistoryController : ControllerBase
{
    private readonly CardsDbContext _db;

    public HistoryController(CardsDbContext db) => _db = db;

    // GET /api/history/{sessionId}
    [HttpGet("{sessionId}")]
    public async Task<ActionResult<List<HistoryResponse>>> GetSessionHistory(
        string sessionId,
        [FromQuery] long? teamId,
        [FromQuery] int? round,
        [FromQuery] string? action)
    {
        var query = _db.CardHistory
            .Include(h => h.Card)
            .Where(h => h.SessionId == sessionId);

        if (teamId.HasValue)
            query = query.Where(h => h.TeamId == teamId.Value);
        if (round.HasValue)
            query = query.Where(h => h.Round == round.Value);
        if (!string.IsNullOrEmpty(action))
            query = query.Where(h => h.Action == action);

        var history = await query
            .OrderByDescending(h => h.Timestamp)
            .ToListAsync();

        return Ok(history.Select(MapHistory).ToList());
    }

    // GET /api/history/{sessionId}/team/{teamId}
    [HttpGet("{sessionId}/team/{teamId}")]
    public async Task<ActionResult<List<HistoryResponse>>> GetTeamHistory(string sessionId, long teamId)
    {
        var history = await _db.CardHistory
            .Include(h => h.Card)
            .Where(h => h.SessionId == sessionId && h.TeamId == teamId)
            .OrderByDescending(h => h.Timestamp)
            .ToListAsync();

        return Ok(history.Select(MapHistory).ToList());
    }

    // POST /api/history/trade
    [HttpPost("trade")]
    public async Task<ActionResult> RecordTrade(RecordTradeRequest request)
    {
        var card = await _db.Cards.FindAsync(request.CardId);
        if (card == null) return NotFound(new { message = "Картку не знайдено" });

        // Record "given" for sender
        _db.CardHistory.Add(new CardHistory
        {
            SessionId = request.SessionId,
            TeamId = request.FromTeamId,
            CardId = request.CardId,
            Action = "given",
            FromTeamId = request.FromTeamId,
            ToTeamId = request.ToTeamId,
            Round = request.Round,
            Timestamp = DateTime.UtcNow
        });

        // Record "received" for receiver
        _db.CardHistory.Add(new CardHistory
        {
            SessionId = request.SessionId,
            TeamId = request.ToTeamId,
            CardId = request.CardId,
            Action = "received",
            FromTeamId = request.FromTeamId,
            ToTeamId = request.ToTeamId,
            Round = request.Round,
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return Ok(new { message = "Обмін записано" });
    }

    // GET /api/history/{sessionId}/stats
    [HttpGet("{sessionId}/stats")]
    public async Task<ActionResult> GetStats(string sessionId)
    {
        var history = await _db.CardHistory
            .Include(h => h.Card)
            .Where(h => h.SessionId == sessionId)
            .ToListAsync();

        var stats = new
        {
            totalDraws = history.Count(h => h.Action == "drawn"),
            totalTrades = history.Count(h => h.Action == "given"),
            bySuit = history
                .Where(h => h.Action == "drawn")
                .GroupBy(h => h.Card.Suit)
                .ToDictionary(g => g.Key, g => g.Count()),
            byTeam = history
                .GroupBy(h => h.TeamId)
                .ToDictionary(g => g.Key, g => g.Count())
        };

        return Ok(stats);
    }

    private static HistoryResponse MapHistory(CardHistory h) => new()
    {
        Id = h.Id, SessionId = h.SessionId, TeamId = h.TeamId, CardId = h.CardId,
        CardName = h.Card.NameUa, CardSuit = h.Card.Suit,
        Action = h.Action, FromTeamId = h.FromTeamId, ToTeamId = h.ToTeamId,
        Round = h.Round, Timestamp = h.Timestamp
    };
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HackathonGame.CardsService.Data;
using HackathonGame.CardsService.DTOs;

namespace HackathonGame.CardsService.Controllers;

[ApiController]
[Route("api/history")]
public class HistoryAggregationController : ControllerBase
{
    private readonly CardsDbContext _db;
    private readonly ILogger<HistoryAggregationController> _logger;

    public HistoryAggregationController(CardsDbContext db, ILogger<HistoryAggregationController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Повертає всі витягнуті картки по командах для вказаного раунду.
    /// Призначено для P3: batch-запит після завершення раунду щоб записати cardId в score_history.
    /// </summary>
    [HttpGet("{sessionId}/round/{round}/summary")]
    [ProducesResponseType(typeof(List<RoundSummaryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<RoundSummaryResponse>>> GetRoundSummary(string sessionId, int round)
    {
        var entries = await _db.CardHistory
            .Include(h => h.Card)
            .Where(h => h.SessionId == sessionId && h.Round == round && h.Action == "drawn")
            .OrderBy(h => h.TeamId)
            .ThenBy(h => h.Timestamp)
            .ToListAsync();

        _logger.LogInformation(
            "GetRoundSummary: session {SessionId}, round {Round} — {Count} entries",
            sessionId, round, entries.Count);

        return Ok(entries.Select(h => new RoundSummaryResponse
        {
            TeamId = h.TeamId,
            CardId = h.CardId,
            CardNameUa = h.Card.NameUa,
            Suit = h.Card.Suit,
            Action = h.Action,
            Timestamp = h.Timestamp
        }).ToList());
    }

    /// <summary>
    /// Повертає агреговану статистику по командах для сесії.
    /// Сортування: totalCardsDrawn DESC. Враховує лише action = "drawn".
    /// </summary>
    [HttpGet("{sessionId}/leaderboard")]
    [ProducesResponseType(typeof(List<TeamStatsResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<TeamStatsResponse>>> GetLeaderboard(string sessionId)
    {
        var drawn = await _db.CardHistory
            .Include(h => h.Card)
            .Where(h => h.SessionId == sessionId && h.Action == "drawn")
            .ToListAsync();

        var stats = drawn
            .GroupBy(h => h.TeamId)
            .Select(g => new TeamStatsResponse
            {
                TeamId = g.Key,
                TotalCardsDrawn = g.Count(),
                CardsBySuit = g
                    .GroupBy(h => h.Card.Suit)
                    .ToDictionary(sg => sg.Key, sg => sg.Count()),
                LastCardAt = g.Max(h => h.Timestamp)
            })
            .OrderByDescending(t => t.TotalCardsDrawn)
            .ToList();

        _logger.LogInformation(
            "GetLeaderboard: session {SessionId} — {TeamCount} teams",
            sessionId, stats.Count);

        return Ok(stats);
    }
}

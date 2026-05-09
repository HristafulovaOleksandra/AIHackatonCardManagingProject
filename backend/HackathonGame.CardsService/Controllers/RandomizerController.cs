using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HackathonGame.CardsService.Data;
using HackathonGame.CardsService.DTOs;
using HackathonGame.CardsService.Models;

namespace HackathonGame.CardsService.Controllers;

[ApiController]
[Route("api/cards")]
public class RandomizerController : ControllerBase
{
    private readonly CardsDbContext _db;
    private static readonly Random _random = new();

    public RandomizerController(CardsDbContext db) => _db = db;

    // POST /api/cards/random
    [HttpPost("random")]
    public async Task<ActionResult<DrawResultResponse>> DrawRandom(DrawRandomRequest request)
    {
        var card = await DrawWeightedRandom(request.Suit, request.Round);
        if (card == null)
            return NotFound(new { message = "Немає доступних карток" });

        var history = new CardHistory
        {
            SessionId = request.SessionId,
            TeamId = request.TeamId,
            CardId = card.Id,
            Action = "drawn",
            Round = request.Round,
            Timestamp = DateTime.UtcNow
        };
        _db.CardHistory.Add(history);
        await _db.SaveChangesAsync();

        return Ok(new DrawResultResponse
        {
            Card = MapCard(card),
            HistoryId = history.Id,
            Timestamp = history.Timestamp
        });
    }

    // POST /api/cards/random/multi
    [HttpPost("random/multi")]
    public async Task<ActionResult<List<DrawResultResponse>>> DrawMulti(DrawMultiRequest request)
    {
        var results = new List<DrawResultResponse>();
        var drawnIds = new HashSet<long>();

        for (int i = 0; i < request.Count; i++)
        {
            var card = await DrawWeightedRandom(request.Suit, request.Round, drawnIds);
            if (card == null) break;

            drawnIds.Add(card.Id);

            var history = new CardHistory
            {
                SessionId = request.SessionId,
                TeamId = request.TeamId,
                CardId = card.Id,
                Action = "drawn",
                Round = request.Round,
                Timestamp = DateTime.UtcNow
            };
            _db.CardHistory.Add(history);
            await _db.SaveChangesAsync();

            results.Add(new DrawResultResponse
            {
                Card = MapCard(card),
                HistoryId = history.Id,
                Timestamp = history.Timestamp
            });
        }

        return Ok(results);
    }

    private async Task<Card?> DrawWeightedRandom(string? suit, int? round, HashSet<long>? excludeIds = null)
    {
        var query = _db.Cards.Where(c => c.IsActive);

        if (!string.IsNullOrEmpty(suit))
            query = query.Where(c => c.Suit == suit);

        if (excludeIds != null && excludeIds.Count > 0)
            query = query.Where(c => !excludeIds.Contains(c.Id));

        var cards = await query.ToListAsync();

        if (round.HasValue)
            cards = cards.Where(c => c.Rounds == null || c.Rounds.Contains(round.Value)).ToList();

        if (cards.Count == 0) return null;

        // Weighted random selection
        var totalWeight = cards.Sum(c => c.Weight);
        var roll = _random.NextDouble() * totalWeight;
        double cumulative = 0;

        foreach (var card in cards)
        {
            cumulative += card.Weight;
            if (roll <= cumulative)
                return card;
        }

        return cards.Last();
    }

    private static CardResponse MapCard(Card c) => new()
    {
        Id = c.Id, NameUa = c.NameUa, NameEn = c.NameEn,
        DescriptionUa = c.DescriptionUa, DescriptionEn = c.DescriptionEn,
        Suit = c.Suit, Type = c.Type, Weight = c.Weight,
        Rounds = c.Rounds, IsActive = c.IsActive, CreatedAt = c.CreatedAt
    };
}

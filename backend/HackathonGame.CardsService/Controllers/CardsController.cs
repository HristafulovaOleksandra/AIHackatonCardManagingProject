using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HackathonGame.CardsService.Data;
using HackathonGame.CardsService.DTOs;
using HackathonGame.CardsService.Models;

namespace HackathonGame.CardsService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CardsController : ControllerBase
{
    private readonly CardsDbContext _db;

    public CardsController(CardsDbContext db) => _db = db;

    // GET /api/cards
    [HttpGet]
    public async Task<ActionResult<List<CardResponse>>> GetCards(
        [FromQuery] string? suit,
        [FromQuery] string? type,
        [FromQuery] bool? active,
        [FromQuery] string? search)
    {
        var query = _db.Cards.AsQueryable();

        if (!string.IsNullOrEmpty(suit))
            query = query.Where(c => c.Suit == suit);
        if (!string.IsNullOrEmpty(type))
            query = query.Where(c => c.Type == type);
        if (active.HasValue)
            query = query.Where(c => c.IsActive == active.Value);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(c =>
                c.NameUa.Contains(search) ||
                c.NameEn.Contains(search));

        var cards = await query.OrderBy(c => c.Suit).ThenBy(c => c.NameUa).ToListAsync();
        return Ok(cards.Select(MapCard).ToList());
    }

    // GET /api/cards/suits/{suit}
    [HttpGet("suits/{suit}")]
    public async Task<ActionResult<List<CardResponse>>> GetBySuit(string suit)
    {
        var cards = await _db.Cards
            .Where(c => c.Suit == suit && c.IsActive)
            .OrderBy(c => c.NameUa)
            .ToListAsync();
        return Ok(cards.Select(MapCard).ToList());
    }

    // GET /api/cards/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<CardResponse>> GetCard(long id)
    {
        var card = await _db.Cards.FindAsync(id);
        if (card == null) return NotFound();
        return Ok(MapCard(card));
    }

    // POST /api/cards
    [HttpPost]
    public async Task<ActionResult<CardResponse>> CreateCard(CreateCardRequest request)
    {
        var card = new Card
        {
            NameUa = request.NameUa,
            NameEn = request.NameEn,
            DescriptionUa = request.DescriptionUa ?? string.Empty,
            DescriptionEn = request.DescriptionEn ?? string.Empty,
            Suit = request.Suit,
            Type = request.Type,
            Weight = request.Weight,
            Rounds = request.Rounds ?? Array.Empty<int>()
        };
        _db.Cards.Add(card);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetCard), new { id = card.Id }, MapCard(card));
    }

    // PUT /api/cards/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<CardResponse>> UpdateCard(long id, UpdateCardRequest request)
    {
        var card = await _db.Cards.FindAsync(id);
        if (card == null) return NotFound();

        if (request.NameUa != null) card.NameUa = request.NameUa;
        if (request.NameEn != null) card.NameEn = request.NameEn;
        if (request.DescriptionUa != null) card.DescriptionUa = request.DescriptionUa;
        if (request.DescriptionEn != null) card.DescriptionEn = request.DescriptionEn;
        if (request.Suit != null) card.Suit = request.Suit;
        if (request.Type != null) card.Type = request.Type;
        if (request.Weight.HasValue) card.Weight = request.Weight.Value;
        if (request.Rounds != null) card.Rounds = request.Rounds;
        if (request.IsActive.HasValue) card.IsActive = request.IsActive.Value;
        card.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(MapCard(card));
    }

    // DELETE /api/cards/{id}
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteCard(long id)
    {
        var card = await _db.Cards.FindAsync(id);
        if (card == null) return NotFound();
        _db.Cards.Remove(card);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // GET /api/cards/suits
    [HttpGet("suits")]
    public ActionResult GetSuits()
    {
        return Ok(new[]
        {
            new { key = CardSuits.Chains, nameUa = "Ланцюги", color = "red" },
            new { key = CardSuits.Virus, nameUa = "Вірус", color = "green" },
            new { key = CardSuits.Wheel, nameUa = "Колесо", color = "blue" },
            new { key = CardSuits.Bolt, nameUa = "Блискавка", color = "yellow" },
            new { key = CardSuits.Eye, nameUa = "Око", color = "purple" },
            new { key = CardSuits.Mask, nameUa = "Маска", color = "orange" },
            new { key = CardSuits.Spiral, nameUa = "Спіраль", color = "pink" },
            new { key = CardSuits.Alert, nameUa = "Сигнал", color = "gray" }
        });
    }

    private static CardResponse MapCard(Card c) => new()
    {
        Id = c.Id, NameUa = c.NameUa, NameEn = c.NameEn,
        DescriptionUa = c.DescriptionUa, DescriptionEn = c.DescriptionEn,
        Suit = c.Suit, Type = c.Type, Weight = c.Weight,
        Rounds = c.Rounds, IsActive = c.IsActive, CreatedAt = c.CreatedAt
    };
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HackathonGame.CardsService.Data;
using HackathonGame.CardsService.DTOs;
using HackathonGame.CardsService.Models;

namespace HackathonGame.CardsService.Controllers;

[ApiController]
[Route("api/cards")]
public class CardFeedbackController : ControllerBase
{
    private readonly CardsDbContext _db;
    private readonly ILogger<CardFeedbackController> _logger;

    public CardFeedbackController(CardsDbContext db, ILogger<CardFeedbackController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Записує від P3 інформацію про нараховані бали за картку.
    /// Дозволяє в майбутньому відображати на HistoryPage скільки балів принесла кожна картка.
    /// </summary>
    [HttpPost("feedback")]
    [ProducesResponseType(typeof(CardFeedbackResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CardFeedbackResponse>> RecordFeedback(CardFeedbackRequest request)
    {
        var card = await _db.Cards.FindAsync(request.CardId);
        if (card == null)
        {
            _logger.LogWarning("RecordFeedback: card {CardId} not found", request.CardId);
            return NotFound(new { message = "Картку не знайдено" });
        }

        var duplicate = await _db.CardFeedbacks.AnyAsync(f =>
            f.SessionId == request.SessionId &&
            f.TeamId == request.TeamId &&
            f.CardId == request.CardId &&
            f.Round == request.Round);

        if (duplicate)
        {
            _logger.LogWarning(
                "RecordFeedback: duplicate feedback ignored — session {SessionId}, team {TeamId}, card {CardId}, round {Round}",
                request.SessionId, request.TeamId, request.CardId, request.Round);
            return BadRequest(new { message = "Feedback для цієї картки в цьому раунді вже записано" });
        }

        var feedback = new CardFeedback
        {
            SessionId = request.SessionId,
            TeamId = request.TeamId,
            CardId = request.CardId,
            Round = request.Round,
            PointsAwarded = request.PointsAwarded,
            Reason = request.Reason,
            RecordedAt = DateTime.UtcNow
        };

        _db.CardFeedbacks.Add(feedback);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "RecordFeedback: session {SessionId}, team {TeamId}, card {CardId}, round {Round}, points {Points}",
            feedback.SessionId, feedback.TeamId, feedback.CardId, feedback.Round, feedback.PointsAwarded);

        return CreatedAtAction(nameof(RecordFeedback), new { id = feedback.Id }, MapResponse(feedback));
    }

    private static CardFeedbackResponse MapResponse(CardFeedback f) => new()
    {
        Id = f.Id,
        SessionId = f.SessionId,
        TeamId = f.TeamId,
        CardId = f.CardId,
        Round = f.Round,
        PointsAwarded = f.PointsAwarded,
        Reason = f.Reason,
        RecordedAt = f.RecordedAt
    };
}

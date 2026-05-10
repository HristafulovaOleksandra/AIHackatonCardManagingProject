using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HackathonGame.CardsService.Models;

[Table("card_feedback")]
public class CardFeedback
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [MaxLength(6)]
    [Column("session_id")]
    public string SessionId { get; set; } = string.Empty;

    [Column("team_id")]
    public long TeamId { get; set; }

    [Column("card_id")]
    public long CardId { get; set; }

    [Column("round")]
    public int? Round { get; set; }

    [Column("points_awarded")]
    public int PointsAwarded { get; set; }

    [Column("reason")]
    public string? Reason { get; set; }

    [Column("recorded_at")]
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("CardId")]
    public Card Card { get; set; } = null!;
}

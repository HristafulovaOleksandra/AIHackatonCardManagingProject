using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HackathonGame.CardsService.Models;

[Table("card_history")]
public class CardHistory
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

    [Required]
    [MaxLength(20)]
    [Column("action")]
    public string Action { get; set; } = "drawn"; // drawn, traded, given, received

    [Column("from_team_id")]
    public long? FromTeamId { get; set; }

    [Column("to_team_id")]
    public long? ToTeamId { get; set; }

    [Column("round")]
    public int? Round { get; set; }

    [Column("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey("CardId")]
    public Card Card { get; set; } = null!;
}

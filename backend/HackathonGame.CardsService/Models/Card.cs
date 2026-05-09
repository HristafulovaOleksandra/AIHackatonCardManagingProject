using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HackathonGame.CardsService.Models;

[Table("cards")]
public class Card
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [MaxLength(200)]
    [Column("name_ua")]
    public string NameUa { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    [Column("name_en")]
    public string NameEn { get; set; } = string.Empty;

    [Required]
    [Column("description_ua")]
    public string DescriptionUa { get; set; } = string.Empty;

    [Required]
    [Column("description_en")]
    public string DescriptionEn { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    [Column("suit")]
    public string Suit { get; set; } = string.Empty;

    [MaxLength(50)]
    [Column("type")]
    public string? Type { get; set; }

    [Column("weight")]
    public double Weight { get; set; } = 1.0;

    [Column("rounds")]
    public int[] Rounds { get; set; } = Array.Empty<int>();

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public static class CardSuits
{
    public const string Chains = "chains";
    public const string Virus = "virus";
    public const string Wheel = "wheel";
    public const string Bolt = "bolt";
    public const string Eye = "eye";
    public const string Mask = "mask";
    public const string Spiral = "spiral";
    public const string Alert = "alert";

    public static readonly string[] All = { Chains, Virus, Wheel, Bolt, Eye, Mask, Spiral, Alert };
}

namespace HackathonGame.CardsService.DTOs;

// --- Request DTOs ---

public class CreateCardRequest
{
    public string NameUa { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? DescriptionUa { get; set; }
    public string? DescriptionEn { get; set; }
    public string Suit { get; set; } = string.Empty;
    public string? Type { get; set; }
    public double Weight { get; set; } = 1.0;
    public int[]? Rounds { get; set; }
}

public class UpdateCardRequest
{
    public string? NameUa { get; set; }
    public string? NameEn { get; set; }
    public string? DescriptionUa { get; set; }
    public string? DescriptionEn { get; set; }
    public string? Suit { get; set; }
    public string? Type { get; set; }
    public double? Weight { get; set; }
    public int[]? Rounds { get; set; }
    public bool? IsActive { get; set; }
}

public class DrawRandomRequest
{
    public string SessionId { get; set; } = string.Empty;
    public long TeamId { get; set; }
    public string? Suit { get; set; }
    public int? Round { get; set; }
}

public class DrawMultiRequest
{
    public string SessionId { get; set; } = string.Empty;
    public long TeamId { get; set; }
    public string? Suit { get; set; }
    public int? Round { get; set; }
    public int Count { get; set; } = 1;
}

public class RecordTradeRequest
{
    public string SessionId { get; set; } = string.Empty;
    public long FromTeamId { get; set; }
    public long ToTeamId { get; set; }
    public long CardId { get; set; }
    public int? Round { get; set; }
}

// --- Response DTOs ---

public class CardResponse
{
    public long Id { get; set; }
    public string NameUa { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? DescriptionUa { get; set; }
    public string? DescriptionEn { get; set; }
    public string Suit { get; set; } = string.Empty;
    public string? Type { get; set; }
    public double Weight { get; set; }
    public int[]? Rounds { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DrawResultResponse
{
    public CardResponse Card { get; set; } = null!;
    public long HistoryId { get; set; }
    public DateTime Timestamp { get; set; }
}

public class HistoryResponse
{
    public long Id { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public long TeamId { get; set; }
    public long CardId { get; set; }
    public string CardName { get; set; } = string.Empty;
    public string CardSuit { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public long? FromTeamId { get; set; }
    public long? ToTeamId { get; set; }
    public int? Round { get; set; }
    public DateTime Timestamp { get; set; }
}

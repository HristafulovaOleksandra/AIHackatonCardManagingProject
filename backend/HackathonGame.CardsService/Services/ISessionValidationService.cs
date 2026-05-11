namespace HackathonGame.CardsService.Services;

public interface ISessionValidationService
{
    /// <summary>
    /// Returns false if P1 explicitly responds 404 (session not found).
    /// Returns true if session exists OR if P1 is unreachable (graceful degradation).
    /// </summary>
    Task<bool> ValidateAsync(string sessionId);
}

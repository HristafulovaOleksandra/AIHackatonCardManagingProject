namespace HackathonGame.CardsService.Services;

public class SessionValidationService : ISessionValidationService
{
    private readonly HttpClient _http;
    private readonly ILogger<SessionValidationService> _logger;

    public SessionValidationService(HttpClient http, ILogger<SessionValidationService> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<bool> ValidateAsync(string sessionId)
    {
        try
        {
            var response = await _http.GetAsync($"/api/sessions/{sessionId}");

            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogInformation("Session {SessionId} not found in P1", sessionId);
                return false;
            }

            return true;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "P1 Sessions Service unavailable — skipping session validation for {SessionId}", sessionId);
            return true;
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogWarning(ex, "P1 Sessions Service timed out — skipping session validation for {SessionId}", sessionId);
            return true;
        }
    }
}

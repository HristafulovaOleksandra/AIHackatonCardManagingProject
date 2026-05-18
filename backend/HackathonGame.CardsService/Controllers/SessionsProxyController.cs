using Microsoft.AspNetCore.Mvc;

namespace HackathonGame.CardsService.Controllers;

[ApiController]
[Route("api/sessions")]
public class SessionsProxyController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;

    public SessionsProxyController(IHttpClientFactory httpClientFactory)
        => _httpClientFactory = httpClientFactory;

    // GET /api/sessions/{code}/teams
    [HttpGet("{code}/teams")]
    public async Task<IActionResult> GetTeams(string code)
    {
        var client = _httpClientFactory.CreateClient("P1Proxy");
        try
        {
            var response = await client.GetAsync($"api/sessions/{code}/teams");
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, content);

            return Content(content, "application/json");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            return StatusCode(503, new { message = "Сервіс сесій недоступний" });
        }
    }
}

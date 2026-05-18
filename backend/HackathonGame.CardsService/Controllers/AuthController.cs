using Microsoft.AspNetCore.Mvc;
using HackathonGame.CardsService.DTOs;

namespace HackathonGame.CardsService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public AuthController(IConfiguration configuration) => _configuration = configuration;

    [HttpPost("admin")]
    public ActionResult AdminLogin([FromBody] AdminLoginRequest request)
    {
        var configLogin = _configuration["AdminAuth:Login"];
        var configPassword = _configuration["AdminAuth:Password"];

        if (request.Login == configLogin && request.Password == configPassword)
            return Ok(new { success = true });

        return Unauthorized(new { message = "Невірний логін або пароль" });
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HackathonGame.CardsService.Migrations
{
    /// <inheritdoc />
    public partial class AddImageDataToCard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "image_data",
                table: "cards",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "image_data",
                table: "cards");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HackathonGame.CardsService.Migrations
{
    /// <inheritdoc />
    public partial class RemoveRarityColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_cards_rarity",
                table: "cards");

            migrationBuilder.DropColumn(
                name: "rarity",
                table: "cards");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "rarity",
                table: "cards",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "common");

            migrationBuilder.CreateIndex(
                name: "IX_cards_rarity",
                table: "cards",
                column: "rarity");
        }
    }
}

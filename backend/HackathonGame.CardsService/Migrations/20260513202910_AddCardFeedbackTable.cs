using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace HackathonGame.CardsService.Migrations
{
    /// <inheritdoc />
    public partial class AddCardFeedbackTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "card_feedback",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    session_id = table.Column<string>(type: "character varying(6)", maxLength: 6, nullable: false),
                    team_id = table.Column<long>(type: "bigint", nullable: false),
                    card_id = table.Column<long>(type: "bigint", nullable: false),
                    round = table.Column<int>(type: "integer", nullable: true),
                    points_awarded = table.Column<int>(type: "integer", nullable: false),
                    reason = table.Column<string>(type: "text", nullable: true),
                    recorded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_card_feedback", x => x.id);
                    table.ForeignKey(
                        name: "FK_card_feedback_cards_card_id",
                        column: x => x.card_id,
                        principalTable: "cards",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_card_feedback_card_id",
                table: "card_feedback",
                column: "card_id");

            migrationBuilder.CreateIndex(
                name: "IX_card_feedback_session_id",
                table: "card_feedback",
                column: "session_id");

            migrationBuilder.CreateIndex(
                name: "IX_card_feedback_session_id_team_id",
                table: "card_feedback",
                columns: new[] { "session_id", "team_id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "card_feedback");
        }
    }
}

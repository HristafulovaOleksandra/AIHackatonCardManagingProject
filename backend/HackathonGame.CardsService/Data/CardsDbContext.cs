using Microsoft.EntityFrameworkCore;
using HackathonGame.CardsService.Models;

namespace HackathonGame.CardsService.Data;

public class CardsDbContext : DbContext
{
    public CardsDbContext(DbContextOptions<CardsDbContext> options) : base(options) { }

    public DbSet<Card> Cards => Set<Card>();
    public DbSet<CardHistory> CardHistory => Set<CardHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Card>(entity =>
        {
            entity.Property(e => e.Weight).HasDefaultValue(1.0);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.HasIndex(e => e.Suit);
        });

        modelBuilder.Entity<CardHistory>(entity =>
        {
            entity.HasOne(h => h.Card)
                  .WithMany()
                  .HasForeignKey(h => h.CardId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.SessionId);
            entity.HasIndex(e => new { e.SessionId, e.TeamId });
        });
    }
}

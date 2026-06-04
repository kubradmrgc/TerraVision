using Microsoft.EntityFrameworkCore;
using TerraVision.Api.Entities;

namespace TerraVision.Api.Data
{
    public class TerraVisionDbContext : DbContext
    {
        public TerraVisionDbContext(DbContextOptions<TerraVisionDbContext> options) : base(options) { }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            StampInMemoryAppointmentRowVersions();
            return await base.SaveChangesAsync(cancellationToken);
        }

        public override int SaveChanges()
        {
            StampInMemoryAppointmentRowVersions();
            return base.SaveChanges();
        }

        private void StampInMemoryAppointmentRowVersions()
        {
            if (Database.IsRelational())
            {
                return;
            }

            foreach (var entry in ChangeTracker.Entries<Appointment>())
            {
                if (entry.State is EntityState.Added or EntityState.Modified)
                {
                    entry.Entity.RowVersion = Guid.NewGuid().ToByteArray();
                }
            }
        }

        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }
        public DbSet<ArSession> ArSessions { get; set; }
        public DbSet<PlantCareCalendar> PlantCareCalendars { get; set; }
        public DbSet<CareLog> CareLogs { get; set; }
        public DbSet<ExchangeProduct> ExchangeProducts { get; set; }
        public DbSet<ExchangeOffer> ExchangeOffers { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<StoreCampaign> StoreCampaigns { get; set; }
        public DbSet<StoreCampaignProduct> StoreCampaignProducts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Customer)
                .WithMany(u => u.CustomerAppointments)
                .HasForeignKey(a => a.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Consultant)
                .WithMany(u => u.ConsultantAppointments)
                .HasForeignKey(a => a.ConsultantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Appointment>()
                .Property(a => a.RowVersion)
                .IsRowVersion();

            // One active booking per consultant + slot; cancelled appointments free the slot.
            modelBuilder.Entity<Appointment>()
                .HasIndex(a => new { a.ConsultantId, a.AppointmentDate })
                .IsUnique()
                .HasFilter("[Status] <> 4 AND [IsDeleted] = 0");

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.LinkedOrder)
                .WithMany()
                .HasForeignKey(a => a.LinkedOrderId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Appointment>()
                .Property(a => a.OutcomeNotes)
                .HasMaxLength(500);

            modelBuilder.Entity<Cart>()
                .HasOne(c => c.User)
                .WithOne(u => u.Cart)
                .HasForeignKey<Cart>(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Cart>()
                .HasIndex(c => c.UserId)
                .IsUnique();

            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.Cart)
                .WithMany(c => c.Items)
                .HasForeignKey(ci => ci.CartId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.Product)
                .WithMany()
                .HasForeignKey(ci => ci.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CartItem>()
                .HasIndex(ci => new { ci.CartId, ci.ProductId })
                .IsUnique();

            modelBuilder.Entity<Product>()
                .Property(p => p.Price)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.CompareAtPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.PromoLabel)
                .HasMaxLength(80);

            modelBuilder.Entity<StoreCampaign>()
                .Property(c => c.Title)
                .HasMaxLength(120);

            modelBuilder.Entity<StoreCampaign>()
                .Property(c => c.Subtitle)
                .HasMaxLength(240);

            modelBuilder.Entity<StoreCampaign>()
                .Property(c => c.BadgeText)
                .HasMaxLength(40);

            modelBuilder.Entity<StoreCampaignProduct>()
                .HasKey(cp => new { cp.CampaignId, cp.ProductId });

            modelBuilder.Entity<StoreCampaignProduct>()
                .HasOne(cp => cp.Campaign)
                .WithMany(c => c.CampaignProducts)
                .HasForeignKey(cp => cp.CampaignId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<StoreCampaignProduct>()
                .HasOne(cp => cp.Product)
                .WithMany(p => p.CampaignProducts)
                .HasForeignKey(cp => cp.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Order>()
                .HasOne(o => o.User)
                .WithMany(u => u.Orders)
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Order>()
                .Property(o => o.TotalAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Order)
                .WithMany(o => o.Items)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Product)
                .WithMany()
                .HasForeignKey(oi => oi.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.UnitPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Order>()
                .Property(o => o.Notes)
                .HasMaxLength(500);

            modelBuilder.Entity<OrderStatusHistory>()
                .HasOne(h => h.Order)
                .WithMany(o => o.StatusHistory)
                .HasForeignKey(h => h.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrderStatusHistory>()
                .HasIndex(h => new { h.OrderId, h.CreatedDate });

            modelBuilder.Entity<OrderStatusHistory>()
                .Property(h => h.Reason)
                .HasMaxLength(500);

            modelBuilder.Entity<ArSession>()
                .HasOne(s => s.User)
                .WithMany(u => u.ArSessions)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ArSession>()
                .HasOne(s => s.Product)
                .WithMany(p => p.ArSessions)
                .HasForeignKey(s => s.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ArSession>()
                .Property(s => s.DeviceModel)
                .HasMaxLength(200);

            modelBuilder.Entity<ArSession>()
                .Property(s => s.ScreenshotUrl)
                .HasMaxLength(500);

            modelBuilder.Entity<ArSession>()
                .Property(s => s.EnvironmentMetadata)
                .HasMaxLength(2000);

            modelBuilder.Entity<ArSession>()
                .Property(s => s.ScaleX)
                .HasPrecision(18, 4);

            modelBuilder.Entity<ArSession>()
                .Property(s => s.ScaleY)
                .HasPrecision(18, 4);

            modelBuilder.Entity<ArSession>()
                .Property(s => s.ScaleZ)
                .HasPrecision(18, 4);

            modelBuilder.Entity<ArSession>()
                .Property(s => s.RotationY)
                .HasPrecision(18, 4);

            modelBuilder.Entity<ArSession>()
                .HasIndex(s => new { s.UserId, s.CreatedDate });

            modelBuilder.Entity<PlantCareCalendar>()
                .HasOne(c => c.User)
                .WithMany(u => u.PlantCareCalendars)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PlantCareCalendar>()
                .HasOne(c => c.Product)
                .WithMany(p => p.PlantCareCalendars)
                .HasForeignKey(c => c.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PlantCareCalendar>()
                .HasIndex(c => new { c.UserId, c.ProductId })
                .IsUnique()
                .HasFilter("[IsDeleted] = 0");

            modelBuilder.Entity<CareLog>()
                .HasOne(l => l.PlantCareCalendar)
                .WithMany(c => c.CareLogs)
                .HasForeignKey(l => l.PlantCareCalendarId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CareLog>()
                .HasIndex(l => new { l.PlantCareCalendarId, l.CompletedAt });

            modelBuilder.Entity<CareLog>()
                .Property(l => l.Notes)
                .HasMaxLength(500);

            modelBuilder.Entity<Product>()
                .Property(p => p.CareInstructions)
                .HasMaxLength(2000);

            modelBuilder.Entity<ExchangeProduct>()
                .HasOne(p => p.Owner)
                .WithMany(u => u.ExchangeProducts)
                .HasForeignKey(p => p.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ExchangeProduct>()
                .Property(p => p.Title)
                .HasMaxLength(120);

            modelBuilder.Entity<ExchangeProduct>()
                .Property(p => p.Description)
                .HasMaxLength(2000);

            modelBuilder.Entity<ExchangeProduct>()
                .Property(p => p.PhotoUrlsJson)
                .HasMaxLength(4000);

            modelBuilder.Entity<ExchangeProduct>()
                .Property(p => p.Price)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ExchangeProduct>()
                .HasIndex(p => new { p.Status, p.IsActive, p.IsDeleted, p.CreatedDate });

            modelBuilder.Entity<ExchangeOffer>()
                .HasOne(o => o.Product)
                .WithMany(p => p.Offers)
                .HasForeignKey(o => o.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ExchangeOffer>()
                .HasOne(o => o.Sender)
                .WithMany(u => u.ExchangeOffersSent)
                .HasForeignKey(o => o.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ExchangeOffer>()
                .Property(o => o.Message)
                .HasMaxLength(500);

            modelBuilder.Entity<ExchangeOffer>()
                .HasIndex(o => new { o.ProductId, o.Status, o.IsDeleted });

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .Property(n => n.Title)
                .HasMaxLength(200);

            modelBuilder.Entity<Notification>()
                .Property(n => n.Message)
                .HasMaxLength(1000);

            modelBuilder.Entity<Notification>()
                .Property(n => n.RelatedEntityType)
                .HasMaxLength(50);

            modelBuilder.Entity<Notification>()
                .HasIndex(n => new { n.UserId, n.IsRead, n.IsDeleted, n.CreatedDate });

            SeedData.ApplyConfiguration(modelBuilder);
        }
    }
}
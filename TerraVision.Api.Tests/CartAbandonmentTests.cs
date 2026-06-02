using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TerraVision.Api.Data;
using TerraVision.Api.Entities;
using TerraVision.Api.Enums;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;
using TerraVision.Api.Models.Realtime;
using TerraVision.Api.Services;
using TerraVision.Api.Settings;
using Xunit;

namespace TerraVision.Api.Tests;

public class CartAbandonmentTests
{
    [Fact]
    public async Task ProcessAbandonedCartsAsync_WhenInactive24h_PublishesEventAndMarksNotified()
    {
        await using var db = CreateDbContext();
        var inactiveAt = DateTime.UtcNow.AddHours(-25);

        var customer = new User
        {
            FirstName = "Abandon",
            LastName = "Test",
            Email = "abandon@test.local",
            Role = UserRole.Customer,
            PasswordHash = [1],
            PasswordSalt = [2]
        };
        var product = new Product
        {
            Name = "Monstera",
            Description = "Plant",
            Price = 49.99m,
            StockQuantity = 10,
            SKU = "MON-1",
            ImageUrl = "/img.jpg",
            CategoryId = 1
        };
        db.Users.Add(customer);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var cart = new Cart
        {
            UserId = customer.Id,
            LastActivityAtUtc = inactiveAt
        };
        db.Carts.Add(cart);
        await db.SaveChangesAsync();

        db.CartItems.Add(new CartItem
        {
            CartId = cart.Id,
            ProductId = product.Id,
            Quantity = 2
        });
        await db.SaveChangesAsync();

        var realtime = new RecordingRealtimeSyncService();
        var emailNotifier = new RecordingCartAbandonmentEmailNotifier();
        var processor = new CartAbandonmentProcessor(
            db,
            realtime,
            emailNotifier,
            Options.Create(new CartAbandonmentSettings { AbandonmentThresholdHours = 24 }),
            NullLogger<CartAbandonmentProcessor>.Instance);

        var published = await processor.ProcessAbandonedCartsAsync();

        Assert.Equal(1, published);
        Assert.Single(realtime.CartAbandonedEvents);
        Assert.Equal(customer.Id, realtime.CartAbandonedEvents[0].UserId);
        Assert.Equal(1, realtime.CartAbandonedEvents[0].ItemCount);
        Assert.Equal(99.98m, realtime.CartAbandonedEvents[0].TotalAmount);
        Assert.Single(emailNotifier.Messages);
        Assert.Equal("abandon@test.local", emailNotifier.Messages[0].ToEmail);
        Assert.Equal("Monstera", emailNotifier.Messages[0].ProductNames[0]);

        var updatedCart = await db.Carts.SingleAsync(c => c.Id == cart.Id);
        Assert.NotNull(updatedCart.AbandonedNotifiedAtUtc);
    }

    [Fact]
    public async Task ProcessAbandonedCartsAsync_WhenOrderPlacedAfterActivity_SkipsCart()
    {
        await using var db = CreateDbContext();
        var inactiveAt = DateTime.UtcNow.AddHours(-25);

        var customer = new User
        {
            FirstName = "Ordered",
            LastName = "Test",
            Email = "ordered@test.local",
            Role = UserRole.Customer,
            PasswordHash = [1],
            PasswordSalt = [2]
        };
        var product = new Product
        {
            Name = "Fern",
            Description = "Plant",
            Price = 19.99m,
            StockQuantity = 5,
            SKU = "FER-1",
            ImageUrl = "/img.jpg",
            CategoryId = 1
        };
        db.Users.Add(customer);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var cart = new Cart
        {
            UserId = customer.Id,
            LastActivityAtUtc = inactiveAt
        };
        db.Carts.Add(cart);
        await db.SaveChangesAsync();

        db.CartItems.Add(new CartItem
        {
            CartId = cart.Id,
            ProductId = product.Id,
            Quantity = 1
        });
        db.Orders.Add(new Order
        {
            UserId = customer.Id,
            TotalAmount = 19.99m,
            CreatedDate = inactiveAt.AddHours(1)
        });
        await db.SaveChangesAsync();

        var realtime = new RecordingRealtimeSyncService();
        var emailNotifier = new RecordingCartAbandonmentEmailNotifier();
        var processor = new CartAbandonmentProcessor(
            db,
            realtime,
            emailNotifier,
            Options.Create(new CartAbandonmentSettings { AbandonmentThresholdHours = 24 }),
            NullLogger<CartAbandonmentProcessor>.Instance);

        var published = await processor.ProcessAbandonedCartsAsync();

        Assert.Equal(0, published);
        Assert.Empty(realtime.CartAbandonedEvents);
        Assert.Empty(emailNotifier.Messages);
    }

    [Fact]
    public async Task ProcessAbandonedCartsAsync_WhenAlreadyNotifiedForWindow_SkipsCart()
    {
        await using var db = CreateDbContext();
        var inactiveAt = DateTime.UtcNow.AddHours(-25);

        var customer = new User
        {
            FirstName = "Notified",
            LastName = "Test",
            Email = "notified@test.local",
            Role = UserRole.Customer,
            PasswordHash = [1],
            PasswordSalt = [2]
        };
        var product = new Product
        {
            Name = "Pot",
            Description = "Planter",
            Price = 9.99m,
            StockQuantity = 20,
            SKU = "POT-1",
            ImageUrl = "/img.jpg",
            CategoryId = 1
        };
        db.Users.Add(customer);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var cart = new Cart
        {
            UserId = customer.Id,
            LastActivityAtUtc = inactiveAt,
            AbandonedNotifiedAtUtc = DateTime.UtcNow.AddHours(-1)
        };
        db.Carts.Add(cart);
        await db.SaveChangesAsync();

        db.CartItems.Add(new CartItem
        {
            CartId = cart.Id,
            ProductId = product.Id,
            Quantity = 1
        });
        await db.SaveChangesAsync();

        var realtime = new RecordingRealtimeSyncService();
        var emailNotifier = new RecordingCartAbandonmentEmailNotifier();
        var processor = new CartAbandonmentProcessor(
            db,
            realtime,
            emailNotifier,
            Options.Create(new CartAbandonmentSettings { AbandonmentThresholdHours = 24 }),
            NullLogger<CartAbandonmentProcessor>.Instance);

        var published = await processor.ProcessAbandonedCartsAsync();

        Assert.Equal(0, published);
        Assert.Empty(realtime.CartAbandonedEvents);
        Assert.Empty(emailNotifier.Messages);
    }

    [Fact]
    public async Task ProcessAbandonedCartsAsync_WhenEmailFails_DoesNotMarkNotifiedOrBroadcast()
    {
        await using var db = CreateDbContext();
        var inactiveAt = DateTime.UtcNow.AddHours(-25);

        var customer = new User
        {
            FirstName = "Fail",
            LastName = "Mail",
            Email = "fail@test.local",
            Role = UserRole.Customer,
            PasswordHash = [1],
            PasswordSalt = [2]
        };
        var product = new Product
        {
            Name = "Aloe",
            Description = "Plant",
            Price = 12m,
            StockQuantity = 5,
            SKU = "ALO-1",
            ImageUrl = "/img.jpg",
            CategoryId = 1
        };
        db.Users.Add(customer);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var cart = new Cart { UserId = customer.Id, LastActivityAtUtc = inactiveAt };
        db.Carts.Add(cart);
        await db.SaveChangesAsync();
        db.CartItems.Add(new CartItem { CartId = cart.Id, ProductId = product.Id, Quantity = 1 });
        await db.SaveChangesAsync();

        var realtime = new RecordingRealtimeSyncService();
        var processor = new CartAbandonmentProcessor(
            db,
            realtime,
            new FailingCartAbandonmentEmailNotifier(),
            Options.Create(new CartAbandonmentSettings { AbandonmentThresholdHours = 24 }),
            NullLogger<CartAbandonmentProcessor>.Instance);

        var published = await processor.ProcessAbandonedCartsAsync();

        Assert.Equal(0, published);
        Assert.Empty(realtime.CartAbandonedEvents);
        var updatedCart = await db.Carts.SingleAsync(c => c.Id == cart.Id);
        Assert.Null(updatedCart.AbandonedNotifiedAtUtc);
    }

    private static TerraVisionDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<TerraVisionDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TerraVisionDbContext(options);
    }

    private sealed class RecordingCartAbandonmentEmailNotifier : ICartAbandonmentEmailNotifier
    {
        public List<CartAbandonmentEmailMessage> Messages { get; } = [];

        public Task SendAbandonedCartReminderAsync(
            CartAbandonmentEmailMessage message,
            CancellationToken cancellationToken = default)
        {
            Messages.Add(message);
            return Task.CompletedTask;
        }
    }

    private sealed class FailingCartAbandonmentEmailNotifier : ICartAbandonmentEmailNotifier
    {
        public Task SendAbandonedCartReminderAsync(
            CartAbandonmentEmailMessage message,
            CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("SMTP unavailable");
    }

    private sealed class RecordingRealtimeSyncService : IRealtimeSyncService
    {
        public List<CartAbandonedEvent> CartAbandonedEvents { get; } = [];

        public Task BroadcastCartChangedAsync(CartChangedEvent cartEvent) => Task.CompletedTask;

        public Task BroadcastOrderCreatedAsync(OrderCreatedEvent orderEvent) => Task.CompletedTask;

        public Task BroadcastOrderStatusChangedAsync(OrderStatusChangedEvent orderEvent) => Task.CompletedTask;

        public Task BroadcastArSessionCreatedAsync(ArSessionCreatedEvent arSessionEvent) => Task.CompletedTask;

        public Task BroadcastProductLowStockAsync(ProductLowStockEvent lowStockEvent) => Task.CompletedTask;

        public Task BroadcastCartAbandonedAsync(CartAbandonedEvent cartEvent, CancellationToken cancellationToken = default)
        {
            CartAbandonedEvents.Add(cartEvent);
            return Task.CompletedTask;
        }

        public Task BroadcastExchangeOfferReceivedAsync(ExchangeOfferReceivedEvent offerEvent) => Task.CompletedTask;

        public Task BroadcastExchangeOfferStatusChangedAsync(ExchangeOfferStatusChangedEvent offerEvent) => Task.CompletedTask;

        public Task BroadcastExchangeProductListedAsync(ExchangeProductDto product) => Task.CompletedTask;

        public Task BroadcastNotificationCreatedAsync(NotificationCreatedEvent notificationEvent) => Task.CompletedTask;
    }
}

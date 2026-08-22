using Microsoft.EntityFrameworkCore;
using TerraVision.Api.Data;
using TerraVision.Api.Entities;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Services;

public static class CareCatalogMatcher
{
    private const int MaxHints = 8;
    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "bir", "bu", "ve", "ile", "için", "icin", "nasıl", "nasil", "ne", "mi", "mı", "mu", "mü",
        "the", "and", "for", "how", "what", "when", "where", "the", "about", "bitki", "bitkisi",
        "takvim", "özet", "ozet", "bugün", "bugun", "gecikmiş", "gecikmis", "sulama", "gübre", "gubre"
    };

    public static async Task<IReadOnlyList<CareCatalogPlantDto>> FindRelevantCatalogPlantsAsync(
        TerraVisionDbContext dbContext,
        int userId,
        string userMessage,
        int? productId,
        CancellationToken cancellationToken = default)
    {
        var gardenProductIds = await dbContext.PlantCareCalendars
            .AsNoTracking()
            .Where(c => c.UserId == userId && !c.IsDeleted && c.IsActive)
            .Select(c => c.ProductId)
            .ToListAsync(cancellationToken);

        var baseQuery = dbContext.Products
            .AsNoTracking()
            .Where(p => !p.IsDeleted && p.IsActive);

        if (productId is > 0)
        {
            var focused = await baseQuery
                .Where(p => p.Id == productId.Value)
                .ToListAsync(cancellationToken);
            return MapCatalog(focused, gardenProductIds);
        }

        var allActive = await baseQuery.ToListAsync(cancellationToken);
        var candidates = allActive.Where(PlantCareRules.QualifiesForCareCalendar).ToList();

        var terms = ExtractSearchTerms(userMessage);
        List<Product> matched;

        if (terms.Count == 0)
        {
            matched = candidates
                .OrderBy(p => p.Name)
                .Take(MaxHints)
                .ToList();
        }
        else
        {
            matched = candidates
                .Select(p => new { Product = p, Score = ScoreProduct(p, terms) })
                .Where(x => x.Score > 0)
                .OrderByDescending(x => x.Score)
                .ThenBy(x => x.Product.Name)
                .Take(MaxHints)
                .Select(x => x.Product)
                .ToList();

            if (matched.Count == 0)
            {
                matched = candidates
                    .Where(p => terms.Any(t => p.Name.Contains(t, StringComparison.OrdinalIgnoreCase)))
                    .Take(MaxHints)
                    .ToList();
            }
        }

        return MapCatalog(matched, gardenProductIds);
    }

    private static IReadOnlyList<CareCatalogPlantDto> MapCatalog(
        IEnumerable<Product> products,
        IReadOnlyCollection<int> gardenProductIds) =>
        products
            .Select(p => new CareCatalogPlantDto
            {
                Id = p.Id,
                Name = p.Name,
                CareInstructions = p.CareInstructions,
                WateringIntervalDays = p.WateringIntervalDays,
                FertilizingIntervalDays = p.FertilizingIntervalDays,
                CleaningIntervalDays = p.CleaningIntervalDays,
                IsInMyGarden = gardenProductIds.Contains(p.Id)
            })
            .ToList();

    private static List<string> ExtractSearchTerms(string message)
    {
        return message
            .Split([' ', ',', '.', '?', '!', ';', ':', '\n', '\r', '\t'], StringSplitOptions.RemoveEmptyEntries)
            .Select(t => t.Trim().ToLowerInvariant())
            .Where(t => t.Length >= 3 && !StopWords.Contains(t))
            .Distinct()
            .Take(6)
            .ToList();
    }

    private static int ScoreProduct(Product product, IReadOnlyList<string> terms)
    {
        var haystack = $"{product.Name} {product.Description} {product.CareInstructions}".ToLowerInvariant();
        var score = 0;
        foreach (var term in terms)
        {
            if (product.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
            {
                score += 3;
            }
            else if (haystack.Contains(term, StringComparison.Ordinal))
            {
                score += 1;
            }
        }

        return score;
    }
}

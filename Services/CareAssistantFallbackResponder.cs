using System.Text;
using TerraVision.Api.Enums;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Services;

public static class CareAssistantFallbackResponder
{
    public static string Generate(
        string userMessage,
        MyPlantCareCalendarResponse calendar,
        IReadOnlyList<CareCatalogPlantDto>? catalogPlants = null)
    {
        var normalized = userMessage.Trim().ToLowerInvariant();
        catalogPlants ??= Array.Empty<CareCatalogPlantDto>();

        if (calendar.Plants.Count == 0)
        {
            if (catalogPlants.Count > 0)
            {
                return BuildCatalogAdviceSection(catalogPlants) + Environment.NewLine +
                       "İsterseniz bu bitkiyi Bahçem sayfasından satın almadan takviminize ekleyebilirsiniz.";
            }

            return """
                   Henüz bahçenizde bitki yok.
                   Mağazadaki bir bitkiyi Bahçeme ekle ile takvime alabilir veya bitki adı yazarak soru sorabilirsiniz (ör. "Monstera sulama").
                   Teslim edilen siparişlerdeki bitkiler de otomatik eklenir.
                   """;
        }

        if (ContainsAny(normalized, "gecik", "gecikmiş", "gecikmis", "overdue", "geç"))
        {
            return BuildOverdueSection(calendar);
        }

        if (ContainsAny(normalized, "sul", "sulama", "water"))
        {
            return BuildActionSection(calendar, CareActionType.Watering, "sulama");
        }

        if (ContainsAny(normalized, "gübre", "gubre", "fertil"))
        {
            return BuildActionSection(calendar, CareActionType.Fertilizing, "gübreleme");
        }

        if (ContainsAny(normalized, "temiz", "yaprak", "clean"))
        {
            return BuildActionSection(calendar, CareActionType.Cleaning, "yaprak temizliği");
        }

        if (ContainsAny(normalized, "bugün", "bugun", "today", "yapılacak", "yapilacak", "görev", "gorev"))
        {
            return BuildTodaySection(calendar);
        }

        if (ContainsAny(normalized, "özet", "ozet", "durum", "takvim", "liste", "hangi bitki"))
        {
            return BuildSummarySection(calendar);
        }

        return BuildSummarySection(calendar) + Environment.NewLine +
               "Daha net yardım için sulama, gecikmiş görevler veya bugünkü işler hakkında sorabilirsiniz.";
    }

    private static bool ContainsAny(string text, params string[] terms) =>
        terms.Any(text.Contains);

    private static string BuildOverdueSection(MyPlantCareCalendarResponse calendar)
    {
        var lines = new List<string> { "Gecikmiş bakım görevleriniz:" };
        var any = false;

        foreach (var plant in calendar.Plants)
        {
            var overdue = plant.Tasks.Where(t => t.Urgency == CareTaskUrgency.Overdue).ToList();
            if (overdue.Count == 0)
            {
                continue;
            }

            any = true;
            lines.Add($"• {plant.ProductName}:");
            foreach (var task in overdue)
            {
                lines.Add($"  - {FormatAction(task.ActionType)} (planlanan: {FormatDate(task.NextDueAt)})");
            }
        }

        if (!any)
        {
            lines.Add("Şu an gecikmiş göreviniz yok. Harika gidiyorsunuz!");
        }

        return string.Join(Environment.NewLine, lines);
    }

    private static string BuildTodaySection(MyPlantCareCalendarResponse calendar)
    {
        var lines = new List<string> { "Bugün veya yakın zamanda dikkat etmeniz gerekenler:" };
        var any = false;

        foreach (var plant in calendar.Plants)
        {
            var urgent = plant.Tasks
                .Where(t => t.Urgency is CareTaskUrgency.Overdue or CareTaskUrgency.DueToday or CareTaskUrgency.Upcoming)
                .ToList();
            if (urgent.Count == 0)
            {
                continue;
            }

            any = true;
            lines.Add($"• {plant.ProductName}:");
            foreach (var task in urgent)
            {
                lines.Add($"  - {FormatAction(task.ActionType)}: {FormatUrgency(task.Urgency)} ({FormatDate(task.NextDueAt)})");
            }
        }

        if (!any)
        {
            lines.Add("Önümüzdeki birkaç gün için acil görev görünmüyor.");
        }

        return string.Join(Environment.NewLine, lines);
    }

    private static string BuildActionSection(
        MyPlantCareCalendarResponse calendar,
        CareActionType action,
        string actionLabel)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"{actionLabel} durumunuz:");

        foreach (var plant in calendar.Plants)
        {
            var task = plant.Tasks.SingleOrDefault(t => t.ActionType == action);
            if (task == null)
            {
                continue;
            }

            sb.AppendLine(
                $"• {plant.ProductName}: {FormatUrgency(task.Urgency)}, sonraki {FormatDate(task.NextDueAt)}, aralık {task.IntervalDays} gün");
            if (!string.IsNullOrWhiteSpace(plant.CareInstructions))
            {
                sb.AppendLine($"  Not: {plant.CareInstructions.Trim()}");
            }
        }

        return sb.ToString().TrimEnd();
    }

    private static string BuildSummarySection(MyPlantCareCalendarResponse calendar)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Takviminizde {calendar.Plants.Count} bitki var:");
        foreach (var plant in calendar.Plants)
        {
            sb.AppendLine($"• {plant.ProductName} — öncelik: {FormatUrgency(plant.OverallUrgency)}");
            var next = plant.Tasks
                .Where(t => t.NextDueAt.HasValue)
                .OrderBy(t => t.NextDueAt)
                .FirstOrDefault();
            if (next != null)
            {
                sb.AppendLine($"  Sıradaki: {FormatAction(next.ActionType)} ({FormatDate(next.NextDueAt)})");
            }
        }

        return sb.ToString().TrimEnd();
    }

    private static string FormatDate(DateTime? value) =>
        value.HasValue ? value.Value.ToString("dd.MM.yyyy") : "—";

    private static string FormatUrgency(CareTaskUrgency urgency) => urgency switch
    {
        CareTaskUrgency.Overdue => "Gecikmiş",
        CareTaskUrgency.DueToday => "Bugün",
        CareTaskUrgency.Upcoming => "Yaklaşan",
        _ => "Planlı"
    };

    private static string FormatAction(CareActionType action) => action switch
    {
        CareActionType.Watering => "Sulama",
        CareActionType.Fertilizing => "Gübreleme",
        CareActionType.Cleaning => "Yaprak temizliği",
        _ => action.ToString()
    };

    private static string BuildCatalogAdviceSection(IReadOnlyList<CareCatalogPlantDto> catalogPlants)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Katalogdan eşleşen bitki bakım önerileri:");
        foreach (var plant in catalogPlants)
        {
            sb.AppendLine($"• {plant.Name}");
            if (!string.IsNullOrWhiteSpace(plant.CareInstructions))
            {
                sb.AppendLine($"  {plant.CareInstructions.Trim()}");
            }

            if (plant.WateringIntervalDays is > 0)
            {
                sb.AppendLine($"  Sulama: yaklaşık her {plant.WateringIntervalDays} günde bir.");
            }

            if (plant.FertilizingIntervalDays is > 0)
            {
                sb.AppendLine($"  Gübre: yaklaşık her {plant.FertilizingIntervalDays} günde bir.");
            }

            if (plant.CleaningIntervalDays is > 0)
            {
                sb.AppendLine($"  Yaprak temizliği: yaklaşık her {plant.CleaningIntervalDays} günde bir.");
            }
        }

        return sb.ToString().TrimEnd();
    }
}

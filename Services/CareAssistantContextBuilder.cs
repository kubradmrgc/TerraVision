using System.Text;
using TerraVision.Api.Enums;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Services;

public static class CareAssistantContextBuilder
{
    public const string Disclaimer =
        "Bu yanıtlar genel bilgilendirme amaçlıdır; ciddi hastalık veya kuruma belirtileri için TerraVision danışman randevusu almanızı öneririz.";

    public static string BuildSystemPrompt(bool hasCatalogReference) =>
        hasCatalogReference
            ? """
              Sen TerraVision bitki bakım asistanısın. Önce kullanıcının bahçe takvimine, yoksa mağaza katalog bakım notlarına dayan.
              Kullanıcı satın almadan da bakım önerisi isteyebilir; katalog verisini bu durumda kullan.
              Türkçe, samimi ve net yaz. Madde işaretleri kullanabilirsin.
              Kesin tıbbi/teşhis ifadelerinden kaçın; emin olmadığın konularda danışman randevusu öner.
              Takvimde kayıtlı bitkiler için gecikme ve yaklaşan tarihlere öncelik ver.
              Katalogda olmayan türler için genel bitki bakımı prensiplerini söyle ve belirsizlikte randevu öner.
              """
            : """
              Sen TerraVision bitki bakım asistanısın. Yanıtlarını kullanıcının bakım takvimi verisine dayandır.
              Türkçe, samimi ve net yaz. Madde işaretleri kullanabilirsin.
              Kesin tıbbi/teşhis ifadelerinden kaçın; emin olmadığın konularda danışman randevusu öner.
              """;

    public static string BuildUserContext(MyPlantCareCalendarResponse calendar, DateTime utcNow)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Bugünün tarihi (UTC): {utcNow:yyyy-MM-dd}");
        sb.AppendLine();

        if (calendar.Plants.Count == 0)
        {
            sb.AppendLine("Kullanıcının bahçesinde kayıtlı bitki yok (satın almadan ekleme yapılmamış).");
        }
        else
        {
            sb.AppendLine("Kullanıcının bitki bakım takvimi:");
            foreach (var plant in calendar.Plants)
            {
                AppendPlantBlock(sb, plant);
            }
        }

        return sb.ToString();
    }

    public static string BuildCatalogContext(IReadOnlyList<CareCatalogPlantDto> catalogPlants)
    {
        if (catalogPlants.Count == 0)
        {
            return string.Empty;
        }

        var sb = new StringBuilder();
        sb.AppendLine();
        sb.AppendLine("Mağaza katalog bakım referansı (satın alma gerekmez):");
        foreach (var plant in catalogPlants)
        {
            sb.AppendLine($"- {plant.Name} (ürün #{plant.Id})");
            if (!string.IsNullOrWhiteSpace(plant.CareInstructions))
            {
                sb.AppendLine($"  Bakım notu: {plant.CareInstructions.Trim()}");
            }

            if (plant.WateringIntervalDays is > 0)
            {
                sb.AppendLine($"  Önerilen sulama aralığı: {plant.WateringIntervalDays} gün");
            }

            if (plant.FertilizingIntervalDays is > 0)
            {
                sb.AppendLine($"  Önerilen gübre aralığı: {plant.FertilizingIntervalDays} gün");
            }

            if (plant.CleaningIntervalDays is > 0)
            {
                sb.AppendLine($"  Önerilen yaprak temizliği: {plant.CleaningIntervalDays} gün");
            }

            if (plant.IsInMyGarden)
            {
                sb.AppendLine("  (Kullanıcının bahçesinde zaten var)");
            }
        }

        return sb.ToString();
    }

    public static string CombineContext(string calendarContext, string catalogContext) =>
        calendarContext + catalogContext;

    private static void AppendPlantBlock(StringBuilder sb, PlantCareCalendarDto plant)
    {
        sb.AppendLine($"- {plant.ProductName} (takvim #{plant.Id}, genel öncelik: {FormatUrgency(plant.OverallUrgency)})");
        if (!string.IsNullOrWhiteSpace(plant.CareInstructions))
        {
            sb.AppendLine($"  Ürün notu: {plant.CareInstructions.Trim()}");
        }

        foreach (var task in plant.Tasks)
        {
            sb.AppendLine(
                $"  • {FormatAction(task.ActionType)}: aralık {task.IntervalDays} gün, " +
                $"son yapılan {FormatDate(task.LastCompletedAt)}, " +
                $"sonraki {FormatDate(task.NextDueAt)}, durum {FormatUrgency(task.Urgency)}");
        }
    }

    public static IReadOnlyList<CareAssistantPlantSnapshot> BuildSnapshots(MyPlantCareCalendarResponse calendar) =>
        calendar.Plants
            .Select(p => new CareAssistantPlantSnapshot
            {
                CalendarId = p.Id,
                ProductName = p.ProductName,
                OverallUrgency = FormatUrgency(p.OverallUrgency)
            })
            .ToList();

    private static string FormatDate(DateTime? value) =>
        value.HasValue ? value.Value.ToString("yyyy-MM-dd HH:mm") + " UTC" : "—";

    private static string FormatUrgency(CareTaskUrgency urgency) => urgency switch
    {
        CareTaskUrgency.Overdue => "Gecikmiş",
        CareTaskUrgency.DueToday => "Bugün",
        CareTaskUrgency.Upcoming => "Yaklaşan (3 gün)",
        _ => "Planlı"
    };

    private static string FormatAction(CareActionType action) => action switch
    {
        CareActionType.Watering => "Sulama",
        CareActionType.Fertilizing => "Gübreleme",
        CareActionType.Cleaning => "Yaprak temizliği",
        _ => action.ToString()
    };
}

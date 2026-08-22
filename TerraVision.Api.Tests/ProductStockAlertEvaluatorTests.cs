using TerraVision.Api.Services;
using Xunit;

namespace TerraVision.Api.Tests;

public class ProductStockAlertEvaluatorTests
{
    [Theory]
    [InlineData(10, 3, 5, true)]
    [InlineData(5, 5, 5, false)]
    [InlineData(4, 3, 5, false)]
    [InlineData(10, 6, 0, false)]
    [InlineData(2, 1, 1, true)]
    public void ShouldNotify_OnlyWhenCrossingThreshold(int previous, int current, int minLevel, bool expected)
    {
        var actual = ProductStockAlertEvaluator.ShouldNotify(previous, current, minLevel);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void BuildMessage_IncludesProductName()
    {
        var message = ProductStockAlertEvaluator.BuildMessage("Monstera", 2, 3);
        Assert.Contains("Monstera", message);
        Assert.Contains("kritik stok", message, StringComparison.OrdinalIgnoreCase);
    }
}

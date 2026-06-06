using TerraVision.Api.Services;
using Xunit;

namespace TerraVision.Api.Tests;

public class ArModelUrlRulesTests
{
    [Theory]
    [InlineData("https://cdn.example.com/ar-models/tree.glb")]
    [InlineData("https://terravision-media.s3.eu-west-1.amazonaws.com/ar-models/tree.glb")]
    public void IsValidPublicHttpsUrl_AcceptsPublicHttps(string url)
    {
        Assert.True(ArModelUrlRules.IsValidPublicHttpsUrl(url));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("/assets/ar-models/tree.glb")]
    [InlineData("http://cdn.example.com/ar-models/tree.glb")]
    [InlineData("https://localhost/assets/ar-models/tree.glb")]
    [InlineData("https://127.0.0.1/ar-models/tree.glb")]
    [InlineData("https://10.0.2.2:5090/assets/ar-models/tree.glb")]
    [InlineData("https://192.168.1.10/assets/ar-models/tree.glb")]
    [InlineData("https://minio.local/ar-models/tree.glb")]
    public void IsValidPublicHttpsUrl_RejectsNonPublicOrNonHttps(string? url)
    {
        Assert.False(ArModelUrlRules.IsValidPublicHttpsUrl(url));
    }

    [Theory]
    [InlineData("http://10.0.2.2:5090/assets/ar-models/tree.glb")]
    [InlineData("http://192.168.1.42:5090/assets/ar-models/tree.glb")]
    public void IsValidDevelopmentArModelUrl_AcceptsLanHttp(string url)
    {
        Assert.True(ArModelUrlRules.IsValidDevelopmentArModelUrl(url));
    }

    [Fact]
    public void IsValidArModelUrl_AllowsLanHttpInDevelopmentMode()
    {
        const string url = "http://10.0.2.2:5090/assets/ar-models/tree.glb";
        Assert.True(ArModelUrlRules.IsValidArModelUrl(url, allowDevelopmentLan: true));
    }
}

using TerraVision.Api.Services;
using Xunit;

namespace TerraVision.Api.Tests;

public class MediaUploadSecurityTests
{
    [Fact]
    public void ValidateHeader_AcceptsPngMagic()
    {
        byte[] png =
        [
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x00
        ];

        var ex = Record.Exception(() => MediaFileSignatureValidator.ValidateHeader(png, ".png"));
        Assert.Null(ex);
    }

    [Fact]
    public void ValidateHeader_RejectsPeExecutableDisguisedAsGlb()
    {
        byte[] pe =
        [
            0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00
        ];

        Assert.Throws<ArgumentException>(() => MediaFileSignatureValidator.ValidateHeader(pe, ".glb"));
    }

    [Fact]
    public void ValidateHeader_AcceptsGlbMagic()
    {
        byte[] glb =
        [
            (byte)'g', (byte)'l', (byte)'T', (byte)'F',
            0x02, 0x00, 0x00, 0x00,
            0x10, 0x00, 0x00, 0x00
        ];

        var ex = Record.Exception(() => MediaFileSignatureValidator.ValidateHeader(glb, ".glb"));
        Assert.Null(ex);
    }

    [Fact]
    public void ValidateHeader_AcceptsGltfJsonLeadingWhitespace()
    {
        byte[] json = "  \uFEFF\n{\"asset\":{\"version\":\"2.0\"}}"u8.ToArray();

        var ex = Record.Exception(() => MediaFileSignatureValidator.ValidateHeader(json, ".gltf"));
        Assert.Null(ex);
    }

    [Fact]
    public void Validate_RejectsOversizedArModel()
    {
        Assert.Throws<ArgumentException>(() =>
            MediaUploadRules.Validate(
                "model.glb",
                MediaUploadRules.MaxArModelSizeBytes + 1,
                MediaUploadRules.MaxArModelSizeBytes,
                MediaUploadRules.ArModelExtensions,
                "ext"));
    }

    [Fact]
    public void MaxArModelSize_Is25Megabytes()
    {
        Assert.Equal(25L * 1024 * 1024, MediaUploadRules.MaxArModelSizeBytes);
    }
}

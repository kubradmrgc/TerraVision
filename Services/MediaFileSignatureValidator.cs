namespace TerraVision.Api.Services;

/// <summary>
/// Validates uploaded media by file header (magic numbers), not extension alone.
/// </summary>
public static class MediaFileSignatureValidator
{
    private const int MinHeaderBytes = 12;

    public static void ValidateHeader(ReadOnlySpan<byte> header, string extension)
    {
        if (header.Length < 4)
        {
            throw new ArgumentException("File content is too small or unreadable.");
        }

        if (ContainsForbiddenContent(header))
        {
            throw new ArgumentException("File content is not an allowed media type.");
        }

        switch (extension)
        {
            case ".jpg":
            case ".jpeg":
                ValidateJpeg(header);
                break;
            case ".png":
                ValidatePng(header);
                break;
            case ".webp":
                ValidateWebp(header);
                break;
            case ".glb":
                ValidateGlb(header);
                break;
            case ".gltf":
                ValidateGltf(header);
                break;
            case ".usdz":
                ValidateZipContainer(header);
                break;
            default:
                throw new ArgumentException("Unsupported file extension.");
        }
    }

    private static bool ContainsForbiddenContent(ReadOnlySpan<byte> header)
    {
        // PE executable
        if (header.Length >= 2 && header[0] == 0x4D && header[1] == 0x5A)
        {
            return true;
        }

        // ELF
        if (header.Length >= 4 && header[0] == 0x7F && header[1] == (byte)'E' && header[2] == (byte)'L' && header[3] == (byte)'F')
        {
            return true;
        }

        // Shebang script
        if (header.Length >= 2 && header[0] == (byte)'#' && header[1] == (byte)'!')
        {
            return true;
        }

        // HTML / XML markers often used in polyglot attacks
        if (header.Length >= 2 && header[0] == (byte)'<' )
        {
            var second = (char)header[1];
            if (second is '!' or '?' or 'h' or 'H' or 's' or 'S')
            {
                return true;
            }
        }

        return false;
    }

    private static void ValidateJpeg(ReadOnlySpan<byte> header)
    {
        if (header.Length < 3 || header[0] != 0xFF || header[1] != 0xD8 || header[2] != 0xFF)
        {
            throw new ArgumentException("File content does not match JPEG format.");
        }
    }

    private static void ValidatePng(ReadOnlySpan<byte> header)
    {
        ReadOnlySpan<byte> png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        if (header.Length < png.Length || !header[..png.Length].SequenceEqual(png))
        {
            throw new ArgumentException("File content does not match PNG format.");
        }
    }

    private static void ValidateWebp(ReadOnlySpan<byte> header)
    {
        if (header.Length < MinHeaderBytes)
        {
            throw new ArgumentException("File content does not match WebP format.");
        }

        ReadOnlySpan<byte> riff = [(byte)'R', (byte)'I', (byte)'F', (byte)'F'];
        ReadOnlySpan<byte> webp = [(byte)'W', (byte)'E', (byte)'B', (byte)'P'];
        if (!header[..4].SequenceEqual(riff) || !header[8..12].SequenceEqual(webp))
        {
            throw new ArgumentException("File content does not match WebP format.");
        }
    }

    private static void ValidateGlb(ReadOnlySpan<byte> header)
    {
        ReadOnlySpan<byte> gltf = [(byte)'g', (byte)'l', (byte)'T', (byte)'F'];
        if (header.Length < 12 || !header[..4].SequenceEqual(gltf))
        {
            throw new ArgumentException("File content does not match GLB (glTF binary) format.");
        }
    }

    private static void ValidateGltf(ReadOnlySpan<byte> header)
    {
        var index = 0;
        while (index < header.Length)
        {
            if (index + 2 < header.Length && header[index] == 0xEF && header[index + 1] == 0xBB && header[index + 2] == 0xBF)
            {
                index += 3;
                continue;
            }

            var b = header[index];
            if (b is (byte)' ' or (byte)'\t' or (byte)'\r' or (byte)'\n')
            {
                index++;
                continue;
            }

            if (b == (byte)'{')
            {
                return;
            }

            break;
        }

        throw new ArgumentException("File content does not match glTF JSON format.");
    }

    private static void ValidateZipContainer(ReadOnlySpan<byte> header)
    {
        // USDZ is a zip archive (PK\x03\x04 or empty-archive PK\x05\x06).
        if (header.Length < 4)
        {
            throw new ArgumentException("File content does not match USDZ (ZIP) format.");
        }

        var isLocalHeader = header[0] == 0x50 && header[1] == 0x4B && header[2] == 0x03 && header[3] == 0x04;
        var isEocd = header[0] == 0x50 && header[1] == 0x4B && header[2] == 0x05 && header[3] == 0x06;
        if (!isLocalHeader && !isEocd)
        {
            throw new ArgumentException("File content does not match USDZ (ZIP) format.");
        }
    }

    public static async Task<int> ReadHeaderAsync(Stream stream, Memory<byte> buffer, CancellationToken cancellationToken)
    {
        var totalRead = 0;
        while (totalRead < buffer.Length)
        {
            var read = await stream.ReadAsync(buffer[totalRead..], cancellationToken);
            if (read == 0)
            {
                break;
            }

            totalRead += read;
        }

        if (stream.CanSeek)
        {
            stream.Position = 0;
        }

        return totalRead;
    }
}

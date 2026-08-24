using Redline.Calibration.Definitions.Xdf;

namespace Redline.Calibration.Tests;

public sealed class AffineTransformTests
{
    [Theory]
    [InlineData("X", 1, 0)]
    [InlineData("X * 0.1", 0.1, 0)]
    [InlineData("(0.351567 * X) + 3.000", 0.351567, 3)]
    [InlineData("2 * (X - 4)", 2, -8)]
    [InlineData("-X / 2 + 7", -0.5, 7)]
    public void Parses_invertible_affine_equations(string equation, double scale, double offset)
    {
        Assert.True(AffineTransform.TryParse(equation, out var transform, out var error), error);
        Assert.Equal(scale, transform.Scale, 10);
        Assert.Equal(offset, transform.Offset, 10);
        Assert.Equal(20, transform.Invert(transform.Apply(20)), 10);
    }

    [Theory]
    [InlineData("X * X")]
    [InlineData("10 / X")]
    [InlineData("sin(X)")]
    [InlineData("0 * X")]
    public void Rejects_noninvertible_or_unsupported_equations(string equation)
    {
        Assert.False(AffineTransform.TryParse(equation, out _, out var error));
        Assert.False(string.IsNullOrWhiteSpace(error));
    }
}


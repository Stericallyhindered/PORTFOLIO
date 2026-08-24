using System.Globalization;

namespace Redline.Calibration.Definitions.Xdf;

public sealed record AffineTransform(double Scale, double Offset)
{
    public static AffineTransform Identity { get; } = new(1, 0);

    public double Apply(double rawValue) => (Scale * rawValue) + Offset;

    public double Invert(double engineeringValue)
    {
        if (Scale == 0)
        {
            throw new InvalidOperationException("A constant conversion cannot be inverted.");
        }

        return (engineeringValue - Offset) / Scale;
    }

    public static bool TryParse(string? equation, out AffineTransform transform, out string? error)
    {
        try
        {
            var parser = new Parser(string.IsNullOrWhiteSpace(equation) ? "X" : equation);
            transform = parser.Parse();
            if (!double.IsFinite(transform.Scale) || !double.IsFinite(transform.Offset))
            {
                throw new FormatException("The equation produces a non-finite conversion.");
            }

            if (transform.Scale == 0)
            {
                throw new FormatException("The equation is constant and cannot be inverted.");
            }

            error = null;
            return true;
        }
        catch (Exception exception) when (exception is FormatException or OverflowException)
        {
            transform = Identity;
            error = exception.Message;
            return false;
        }
    }

    private sealed class Parser
    {
        private readonly Tokenizer _tokenizer;
        private Token _current;

        public Parser(string equation)
        {
            _tokenizer = new Tokenizer(equation);
            _current = _tokenizer.Next();
        }

        public AffineTransform Parse()
        {
            var value = ParseExpression();
            Expect(TokenKind.End);
            return value;
        }

        private AffineTransform ParseExpression()
        {
            var left = ParseTerm();
            while (_current.Kind is TokenKind.Plus or TokenKind.Minus)
            {
                var operation = _current.Kind;
                Advance();
                var right = ParseTerm();
                left = operation == TokenKind.Plus
                    ? new AffineTransform(left.Scale + right.Scale, left.Offset + right.Offset)
                    : new AffineTransform(left.Scale - right.Scale, left.Offset - right.Offset);
            }

            return left;
        }

        private AffineTransform ParseTerm()
        {
            var left = ParseFactor();
            while (_current.Kind is TokenKind.Star or TokenKind.Slash)
            {
                var operation = _current.Kind;
                Advance();
                var right = ParseFactor();
                left = operation == TokenKind.Star ? Multiply(left, right) : Divide(left, right);
            }

            return left;
        }

        private AffineTransform ParseFactor()
        {
            if (_current.Kind == TokenKind.Plus)
            {
                Advance();
                return ParseFactor();
            }

            if (_current.Kind == TokenKind.Minus)
            {
                Advance();
                var value = ParseFactor();
                return new AffineTransform(-value.Scale, -value.Offset);
            }

            if (_current.Kind == TokenKind.Number)
            {
                var value = _current.Number;
                Advance();
                return new AffineTransform(0, value);
            }

            if (_current.Kind == TokenKind.Variable)
            {
                Advance();
                return Identity;
            }

            if (_current.Kind == TokenKind.LeftParenthesis)
            {
                Advance();
                var value = ParseExpression();
                Expect(TokenKind.RightParenthesis);
                Advance();
                return value;
            }

            throw new FormatException($"Unexpected token '{_current.Text}' in conversion equation.");
        }

        private static AffineTransform Multiply(AffineTransform left, AffineTransform right)
        {
            if (left.Scale != 0 && right.Scale != 0)
            {
                throw new FormatException("Nonlinear conversion equations are not write-safe.");
            }

            return left.Scale == 0
                ? new AffineTransform(right.Scale * left.Offset, right.Offset * left.Offset)
                : new AffineTransform(left.Scale * right.Offset, left.Offset * right.Offset);
        }

        private static AffineTransform Divide(AffineTransform left, AffineTransform right)
        {
            if (right.Scale != 0)
            {
                throw new FormatException("Division by an expression containing X is not write-safe.");
            }

            if (right.Offset == 0)
            {
                throw new FormatException("Division by zero in conversion equation.");
            }

            return new AffineTransform(left.Scale / right.Offset, left.Offset / right.Offset);
        }

        private void Expect(TokenKind kind)
        {
            if (_current.Kind != kind)
            {
                throw new FormatException($"Expected {kind}, found '{_current.Text}'.");
            }
        }

        private void Advance() => _current = _tokenizer.Next();
    }

    private sealed class Tokenizer
    {
        private readonly string _text;
        private int _position;

        public Tokenizer(string text) => _text = text;

        public Token Next()
        {
            while (_position < _text.Length && char.IsWhiteSpace(_text[_position])) _position++;
            if (_position >= _text.Length) return new Token(TokenKind.End, string.Empty, 0);

            var character = _text[_position];
            _position++;
            switch (character)
            {
                case '+': return new Token(TokenKind.Plus, "+", 0);
                case '-': return new Token(TokenKind.Minus, "-", 0);
                case '*': return new Token(TokenKind.Star, "*", 0);
                case '/': return new Token(TokenKind.Slash, "/", 0);
                case '(': return new Token(TokenKind.LeftParenthesis, "(", 0);
                case ')': return new Token(TokenKind.RightParenthesis, ")", 0);
            }

            if (character is 'x' or 'X')
            {
                return new Token(TokenKind.Variable, character.ToString(), 0);
            }

            if (char.IsDigit(character) || character == '.')
            {
                var start = _position - 1;
                while (_position < _text.Length && (char.IsDigit(_text[_position]) || _text[_position] == '.')) _position++;
                if (_position < _text.Length && _text[_position] is 'e' or 'E')
                {
                    _position++;
                    if (_position < _text.Length && _text[_position] is '+' or '-') _position++;
                    while (_position < _text.Length && char.IsDigit(_text[_position])) _position++;
                }

                var tokenText = _text[start.._position];
                if (!double.TryParse(tokenText, NumberStyles.Float, CultureInfo.InvariantCulture, out var number))
                {
                    throw new FormatException($"Invalid number '{tokenText}' in conversion equation.");
                }

                return new Token(TokenKind.Number, tokenText, number);
            }

            throw new FormatException($"Unsupported character '{character}' in conversion equation.");
        }
    }

    private enum TokenKind
    {
        End,
        Number,
        Variable,
        Plus,
        Minus,
        Star,
        Slash,
        LeftParenthesis,
        RightParenthesis
    }

    private sealed record Token(TokenKind Kind, string Text, double Number);
}


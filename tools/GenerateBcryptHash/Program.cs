var pw = args.Length > 0 ? args[0] : "admin123";
Console.WriteLine(BCrypt.Net.BCrypt.HashPassword(pw, workFactor: 11));

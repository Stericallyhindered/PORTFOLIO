using System.Globalization;
using System.Security.Cryptography;
using Microsoft.Data.Sqlite;
using Redline.Calibration.Domain;

namespace Redline.Calibration.Persistence;

public sealed class LocalProfileStore
{
    private readonly string _connectionString;

    public LocalProfileStore(string vaultRoot)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(vaultRoot);
        VaultRoot = Path.GetFullPath(vaultRoot);
        Directory.CreateDirectory(VaultRoot);
        DatabasePath = Path.Combine(VaultRoot, "profiles.db");
        _connectionString = new SqliteConnectionStringBuilder
        {
            DataSource = DatabasePath,
            Mode = SqliteOpenMode.ReadWriteCreate,
            Cache = SqliteCacheMode.Shared,
            ForeignKeys = true,
            Pooling = false
        }.ToString();
    }

    public string VaultRoot { get; }

    public string DatabasePath { get; }

    public static string DefaultVaultRoot
    {
        get
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            var gcalRoot = Path.Combine(appData, "GCAL Studio", "Vault");
            var legacyRoot = Path.Combine(appData, "REDLINE Calibration Studio", "Vault");
            return !File.Exists(Path.Combine(gcalRoot, "profiles.db")) && File.Exists(Path.Combine(legacyRoot, "profiles.db"))
                ? legacyRoot
                : gcalRoot;
        }
    }

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken).ConfigureAwait(false);
        await ExecuteAsync(connection, null, """
            PRAGMA journal_mode=WAL;
            PRAGMA synchronous=FULL;
            PRAGMA foreign_keys=ON;
            PRAGMA busy_timeout=5000;

            CREATE TABLE IF NOT EXISTS customers (
                id TEXT PRIMARY KEY,
                display_name TEXT NOT NULL CHECK(length(trim(display_name)) > 0),
                company TEXT NULL,
                email TEXT NULL,
                phone TEXT NULL,
                notes TEXT NULL,
                created_utc TEXT NOT NULL,
                modified_utc TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS vehicles (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
                display_name TEXT NOT NULL CHECK(length(trim(display_name)) > 0),
                vin TEXT NULL,
                model_year INTEGER NULL,
                make TEXT NOT NULL,
                model TEXT NOT NULL,
                chassis TEXT NULL,
                engine_family TEXT NOT NULL,
                transmission TEXT NULL,
                odometer TEXT NULL,
                notes TEXT NULL,
                created_utc TEXT NOT NULL,
                modified_utc TEXT NOT NULL
            );
            CREATE UNIQUE INDEX IF NOT EXISTS ux_vehicles_vin ON vehicles(vin) WHERE vin IS NOT NULL AND length(trim(vin)) > 0;
            CREATE INDEX IF NOT EXISTS ix_vehicles_customer ON vehicles(customer_id, display_name);

            CREATE TABLE IF NOT EXISTS engine_builds (
                id TEXT PRIMARY KEY,
                vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
                revision INTEGER NOT NULL CHECK(revision > 0),
                name TEXT NOT NULL,
                status TEXT NOT NULL,
                engine_code TEXT NOT NULL,
                cylinder_count INTEGER NOT NULL CHECK(cylinder_count > 0),
                main_journal_count INTEGER NOT NULL CHECK(main_journal_count > 0),
                displacement_cc TEXT NULL,
                bore_mm TEXT NULL,
                stroke_mm TEXT NULL,
                compression_ratio TEXT NULL,
                block TEXT NULL,
                cylinder_head TEXT NULL,
                crankshaft TEXT NULL,
                connecting_rods TEXT NULL,
                pistons TEXT NULL,
                head_gasket TEXT NULL,
                head_gasket_thickness_mm TEXT NULL,
                fuel TEXT NULL,
                builder TEXT NULL,
                assembly_date_utc TEXT NULL,
                notes TEXT NULL,
                created_utc TEXT NOT NULL,
                modified_utc TEXT NOT NULL,
                UNIQUE(vehicle_id, revision)
            );
            CREATE INDEX IF NOT EXISTS ix_engine_builds_vehicle ON engine_builds(vehicle_id, revision DESC);

            CREATE TABLE IF NOT EXISTS build_measurements (
                id TEXT PRIMARY KEY,
                engine_build_id TEXT NOT NULL REFERENCES engine_builds(id) ON DELETE CASCADE,
                system TEXT NOT NULL,
                component TEXT NOT NULL,
                position TEXT NOT NULL,
                specification TEXT NOT NULL,
                target_value TEXT NULL,
                actual_value TEXT NULL,
                minimum_value TEXT NULL,
                maximum_value TEXT NULL,
                unit TEXT NOT NULL,
                method TEXT NULL,
                instrument TEXT NULL,
                source TEXT NULL,
                notes TEXT NULL,
                sort_order INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS ix_measurements_build ON build_measurements(engine_build_id, sort_order);

            CREATE TABLE IF NOT EXISTS build_fastener_events (
                id TEXT PRIMARY KEY,
                engine_build_id TEXT NOT NULL REFERENCES engine_builds(id) ON DELETE CASCADE,
                fastener_group TEXT NOT NULL,
                position TEXT NOT NULL,
                manufacturer TEXT NULL,
                part_number TEXT NULL,
                installation_cycle INTEGER NOT NULL CHECK(installation_cycle > 0),
                torque_nm TEXT NULL,
                angle_degrees TEXT NULL,
                stretch_mm TEXT NULL,
                lubricant TEXT NULL,
                procedure_source TEXT NULL,
                performed_utc TEXT NULL,
                technician TEXT NULL,
                notes TEXT NULL,
                sort_order INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS ix_fasteners_build ON build_fastener_events(engine_build_id, sort_order);

            CREATE TABLE IF NOT EXISTS build_hardware (
                id TEXT PRIMARY KEY,
                engine_build_id TEXT NOT NULL REFERENCES engine_builds(id) ON DELETE CASCADE,
                system TEXT NOT NULL,
                component_type TEXT NOT NULL,
                manufacturer TEXT NULL,
                model TEXT NULL,
                part_number TEXT NULL,
                serial_number TEXT NULL,
                rated_value TEXT NULL,
                rated_unit TEXT NULL,
                calibration_data TEXT NULL,
                notes TEXT NULL,
                sort_order INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS ix_hardware_build ON build_hardware(engine_build_id, sort_order);

            CREATE TABLE IF NOT EXISTS content_objects (
                sha256 TEXT PRIMARY KEY CHECK(length(sha256) = 64),
                size_bytes INTEGER NOT NULL CHECK(size_bytes >= 0),
                relative_path TEXT NOT NULL UNIQUE,
                created_utc TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS profile_assets (
                id TEXT PRIMARY KEY,
                vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
                engine_build_id TEXT NULL REFERENCES engine_builds(id) ON DELETE RESTRICT,
                kind TEXT NOT NULL,
                object_sha256 TEXT NOT NULL REFERENCES content_objects(sha256) ON DELETE RESTRICT,
                original_file_name TEXT NOT NULL,
                software_id TEXT NULL,
                notes TEXT NULL,
                imported_utc TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS ix_assets_build ON profile_assets(engine_build_id, imported_utc DESC);

            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_utc TEXT NOT NULL
            );
            INSERT OR IGNORE INTO schema_migrations(version, applied_utc) VALUES (1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
            """, cancellationToken).ConfigureAwait(false);
    }

    public async Task SaveDocumentAsync(EngineBuildDocument document, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(document);
        Validate(document);
        await using var connection = await OpenAsync(cancellationToken).ConfigureAwait(false);
        using var transaction = connection.BeginTransaction();
        try
        {
            await UpsertCustomerAsync(connection, transaction, document.Customer, cancellationToken).ConfigureAwait(false);
            await UpsertVehicleAsync(connection, transaction, document.Vehicle, cancellationToken).ConfigureAwait(false);
            await UpsertBuildAsync(connection, transaction, document.Build, cancellationToken).ConfigureAwait(false);
            await ReplaceChildrenAsync(connection, transaction, document, cancellationToken).ConfigureAwait(false);
            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<IReadOnlyList<CustomerProfile>> GetCustomersAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT id, display_name, company, email, phone, notes, created_utc, modified_utc FROM customers ORDER BY display_name COLLATE NOCASE;";
        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        var rows = new List<CustomerProfile>();
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false)) rows.Add(ReadCustomer(reader));
        return rows;
    }

    public async Task<IReadOnlyList<VehicleProfile>> GetVehiclesAsync(string customerId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(customerId);
        await using var connection = await OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM vehicles WHERE customer_id = $customer ORDER BY display_name COLLATE NOCASE;";
        command.Parameters.AddWithValue("$customer", customerId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        var rows = new List<VehicleProfile>();
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false)) rows.Add(ReadVehicle(reader));
        return rows;
    }

    public async Task<IReadOnlyList<EngineBuildProfile>> GetBuildsAsync(string vehicleId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(vehicleId);
        await using var connection = await OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM engine_builds WHERE vehicle_id = $vehicle ORDER BY revision DESC;";
        command.Parameters.AddWithValue("$vehicle", vehicleId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        var rows = new List<EngineBuildProfile>();
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false)) rows.Add(ReadBuild(reader));
        return rows;
    }

    public async Task<EngineBuildDocument> GetDocumentAsync(string buildId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(buildId);
        await using var connection = await OpenAsync(cancellationToken).ConfigureAwait(false);
        var build = await ReadSingleBuildAsync(connection, buildId, cancellationToken).ConfigureAwait(false)
            ?? throw new KeyNotFoundException($"Engine build '{buildId}' was not found.");
        var vehicle = await ReadSingleVehicleAsync(connection, build.VehicleId, cancellationToken).ConfigureAwait(false)
            ?? throw new InvalidDataException("The engine build references a missing vehicle.");
        var customer = await ReadSingleCustomerAsync(connection, vehicle.CustomerId, cancellationToken).ConfigureAwait(false)
            ?? throw new InvalidDataException("The vehicle references a missing customer.");
        var measurements = await ReadMeasurementsAsync(connection, buildId, cancellationToken).ConfigureAwait(false);
        var fasteners = await ReadFastenersAsync(connection, buildId, cancellationToken).ConfigureAwait(false);
        var hardware = await ReadHardwareAsync(connection, buildId, cancellationToken).ConfigureAwait(false);
        return new EngineBuildDocument(customer, vehicle, build, measurements, fasteners, hardware);
    }

    public async Task<ProfileAsset> ImportAssetAsync(
        string vehicleId,
        string? engineBuildId,
        string sourcePath,
        string kind,
        string? softwareId = null,
        string? notes = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(vehicleId);
        ArgumentException.ThrowIfNullOrWhiteSpace(sourcePath);
        ArgumentException.ThrowIfNullOrWhiteSpace(kind);
        var fullSourcePath = Path.GetFullPath(sourcePath);
        if (!File.Exists(fullSourcePath)) throw new FileNotFoundException("Profile asset was not found.", fullSourcePath);
        var stagingRoot = Path.Combine(VaultRoot, "staging");
        Directory.CreateDirectory(stagingRoot);
        var stagingPath = Path.Combine(stagingRoot, $"{Guid.NewGuid():N}.import");
        string hash;
        long size;
        try
        {
            {
                await using var source = new FileStream(fullSourcePath, FileMode.Open, FileAccess.Read, FileShare.Read, 128 * 1024, FileOptions.Asynchronous | FileOptions.SequentialScan);
                await using var staging = new FileStream(stagingPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 128 * 1024, FileOptions.Asynchronous | FileOptions.WriteThrough);
                using var hasher = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
                var buffer = new byte[128 * 1024];
                size = 0;
                int read;
                while ((read = await source.ReadAsync(buffer, cancellationToken).ConfigureAwait(false)) > 0)
                {
                    hasher.AppendData(buffer, 0, read);
                    await staging.WriteAsync(buffer.AsMemory(0, read), cancellationToken).ConfigureAwait(false);
                    size += read;
                }
                await staging.FlushAsync(cancellationToken).ConfigureAwait(false);
                staging.Flush(flushToDisk: true);
                hash = Convert.ToHexString(hasher.GetHashAndReset());
            }

            var relativePath = Path.Combine("objects", "sha256", hash[..2], hash);
            var objectPath = Path.Combine(VaultRoot, relativePath);
            Directory.CreateDirectory(Path.GetDirectoryName(objectPath)!);
            if (File.Exists(objectPath))
            {
                var existing = new FileInfo(objectPath);
                if (existing.Length != size) throw new InvalidDataException($"Content object collision for {hash}.");
                File.Delete(stagingPath);
            }
            else
            {
                File.Move(stagingPath, objectPath);
            }

            var imported = DateTimeOffset.UtcNow;
            var asset = new ProfileAsset(
                Guid.NewGuid().ToString("N"), vehicleId, engineBuildId, kind.Trim(), hash, size,
                Path.GetFileName(fullSourcePath), relativePath.Replace('\\', '/'), softwareId, notes, imported);
            await using var connection = await OpenAsync(cancellationToken).ConfigureAwait(false);
            using var transaction = connection.BeginTransaction();
            if (engineBuildId is not null)
            {
                await using var relationship = connection.CreateCommand();
                relationship.Transaction = transaction;
                relationship.CommandText = "SELECT COUNT(*) FROM engine_builds WHERE id=$build AND vehicle_id=$vehicle;";
                relationship.Parameters.AddWithValue("$build", engineBuildId);
                relationship.Parameters.AddWithValue("$vehicle", vehicleId);
                if (Convert.ToInt64(await relationship.ExecuteScalarAsync(cancellationToken).ConfigureAwait(false), CultureInfo.InvariantCulture) != 1)
                {
                    throw new InvalidDataException("The selected build does not belong to the selected vehicle.");
                }
            }
            await ExecuteAsync(connection, transaction, "INSERT OR IGNORE INTO content_objects VALUES ($hash,$size,$path,$created);", cancellationToken,
                ("$hash", hash), ("$size", size), ("$path", asset.RelativeObjectPath), ("$created", Date(imported))).ConfigureAwait(false);
            await ExecuteAsync(connection, transaction, "INSERT INTO profile_assets VALUES ($id,$vehicle,$build,$kind,$hash,$name,$software,$notes,$imported);", cancellationToken,
                ("$id", asset.Id), ("$vehicle", vehicleId), ("$build", engineBuildId), ("$kind", asset.Kind), ("$hash", hash),
                ("$name", asset.OriginalFileName), ("$software", softwareId), ("$notes", notes), ("$imported", Date(imported))).ConfigureAwait(false);
            transaction.Commit();
            return asset;
        }
        finally
        {
            if (File.Exists(stagingPath)) File.Delete(stagingPath);
        }
    }

    public async Task<IReadOnlyList<ProfileAsset>> GetAssetsAsync(string buildId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(buildId);
        await using var connection = await OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT a.id,a.vehicle_id,a.engine_build_id,a.kind,a.object_sha256,o.size_bytes,a.original_file_name,o.relative_path,a.software_id,a.notes,a.imported_utc
            FROM profile_assets a JOIN content_objects o ON o.sha256=a.object_sha256
            WHERE a.engine_build_id=$build ORDER BY a.imported_utc DESC;
            """;
        command.Parameters.AddWithValue("$build", buildId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        var rows = new List<ProfileAsset>();
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false)) rows.Add(new ProfileAsset(
            reader.GetString(0), reader.GetString(1), reader.IsDBNull(2) ? null : reader.GetString(2), reader.GetString(3), reader.GetString(4), reader.GetInt64(5),
            reader.GetString(6), reader.GetString(7), reader.IsDBNull(8) ? null : reader.GetString(8), reader.IsDBNull(9) ? null : reader.GetString(9),
            DateTimeOffset.Parse(reader.GetString(10), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind)));
        return rows;
    }

    public string GetAssetObjectPath(ProfileAsset asset)
    {
        ArgumentNullException.ThrowIfNull(asset);
        var path = Path.GetFullPath(Path.Combine(VaultRoot, asset.RelativeObjectPath.Replace('/', Path.DirectorySeparatorChar)));
        var objectsRoot = Path.GetFullPath(Path.Combine(VaultRoot, "objects")) + Path.DirectorySeparatorChar;
        if (!path.StartsWith(objectsRoot, StringComparison.OrdinalIgnoreCase)) throw new InvalidDataException("Asset object path escapes the vault.");
        return path;
    }

    private async Task<SqliteConnection> OpenAsync(CancellationToken cancellationToken)
    {
        var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync(cancellationToken).ConfigureAwait(false);
        await ExecuteAsync(connection, null, "PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;", cancellationToken).ConfigureAwait(false);
        return connection;
    }

    private static async Task UpsertCustomerAsync(SqliteConnection connection, SqliteTransaction transaction, CustomerProfile row, CancellationToken token) =>
        await ExecuteAsync(connection, transaction, """
            INSERT INTO customers VALUES ($id,$name,$company,$email,$phone,$notes,$created,$modified)
            ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name, company=excluded.company, email=excluded.email,
            phone=excluded.phone, notes=excluded.notes, modified_utc=excluded.modified_utc;
            """, token, ("$id", row.Id), ("$name", row.DisplayName), ("$company", row.Company), ("$email", row.Email),
            ("$phone", row.Phone), ("$notes", row.Notes), ("$created", Date(row.CreatedUtc)), ("$modified", Date(row.ModifiedUtc))).ConfigureAwait(false);

    private static async Task UpsertVehicleAsync(SqliteConnection connection, SqliteTransaction transaction, VehicleProfile row, CancellationToken token) =>
        await ExecuteAsync(connection, transaction, """
            INSERT INTO vehicles VALUES ($id,$customer,$name,$vin,$year,$make,$model,$chassis,$engine,$trans,$odometer,$notes,$created,$modified)
            ON CONFLICT(id) DO UPDATE SET customer_id=excluded.customer_id, display_name=excluded.display_name, vin=excluded.vin,
            model_year=excluded.model_year, make=excluded.make, model=excluded.model, chassis=excluded.chassis,
            engine_family=excluded.engine_family, transmission=excluded.transmission, odometer=excluded.odometer,
            notes=excluded.notes, modified_utc=excluded.modified_utc;
            """, token, ("$id", row.Id), ("$customer", row.CustomerId), ("$name", row.DisplayName), ("$vin", row.Vin),
            ("$year", row.ModelYear), ("$make", row.Make), ("$model", row.Model), ("$chassis", row.Chassis),
            ("$engine", row.EngineFamily), ("$trans", row.Transmission), ("$odometer", row.Odometer), ("$notes", row.Notes),
            ("$created", Date(row.CreatedUtc)), ("$modified", Date(row.ModifiedUtc))).ConfigureAwait(false);

    private static async Task UpsertBuildAsync(SqliteConnection connection, SqliteTransaction transaction, EngineBuildProfile row, CancellationToken token) =>
        await ExecuteAsync(connection, transaction, """
            INSERT INTO engine_builds VALUES ($id,$vehicle,$revision,$name,$status,$code,$cylinders,$mains,$displacement,$bore,$stroke,$compression,$block,$head,$crank,$rods,$pistons,$gasket,$gasket_thickness,$fuel,$builder,$assembly,$notes,$created,$modified)
            ON CONFLICT(id) DO UPDATE SET name=excluded.name, status=excluded.status, engine_code=excluded.engine_code,
            cylinder_count=excluded.cylinder_count, main_journal_count=excluded.main_journal_count,
            displacement_cc=excluded.displacement_cc, bore_mm=excluded.bore_mm, stroke_mm=excluded.stroke_mm,
            compression_ratio=excluded.compression_ratio, block=excluded.block, cylinder_head=excluded.cylinder_head,
            crankshaft=excluded.crankshaft, connecting_rods=excluded.connecting_rods, pistons=excluded.pistons,
            head_gasket=excluded.head_gasket, head_gasket_thickness_mm=excluded.head_gasket_thickness_mm,
            fuel=excluded.fuel, builder=excluded.builder, assembly_date_utc=excluded.assembly_date_utc,
            notes=excluded.notes, modified_utc=excluded.modified_utc;
            """, token, ("$id", row.Id), ("$vehicle", row.VehicleId), ("$revision", row.Revision), ("$name", row.Name),
            ("$status", row.Status), ("$code", row.EngineCode), ("$cylinders", row.CylinderCount), ("$mains", row.MainJournalCount),
            ("$displacement", Decimal(row.DisplacementCc)), ("$bore", Decimal(row.BoreMm)), ("$stroke", Decimal(row.StrokeMm)),
            ("$compression", Decimal(row.CompressionRatio)), ("$block", row.Block), ("$head", row.CylinderHead),
            ("$crank", row.Crankshaft), ("$rods", row.ConnectingRods), ("$pistons", row.Pistons), ("$gasket", row.HeadGasket),
            ("$gasket_thickness", Decimal(row.HeadGasketThicknessMm)), ("$fuel", row.Fuel), ("$builder", row.Builder),
            ("$assembly", Date(row.AssemblyDateUtc)), ("$notes", row.Notes), ("$created", Date(row.CreatedUtc)),
            ("$modified", Date(row.ModifiedUtc))).ConfigureAwait(false);

    private static async Task ReplaceChildrenAsync(SqliteConnection connection, SqliteTransaction transaction, EngineBuildDocument document, CancellationToken token)
    {
        foreach (var table in new[] { "build_measurements", "build_fastener_events", "build_hardware" })
        {
            await ExecuteAsync(connection, transaction, $"DELETE FROM {table} WHERE engine_build_id = $build;", token, ("$build", document.Build.Id)).ConfigureAwait(false);
        }

        foreach (var row in document.Measurements)
        {
            await ExecuteAsync(connection, transaction, """
                INSERT INTO build_measurements VALUES ($id,$build,$system,$component,$position,$spec,$target,$actual,$min,$max,$unit,$method,$instrument,$source,$notes,$sort);
                """, token, ("$id", row.Id), ("$build", row.EngineBuildId), ("$system", row.System), ("$component", row.Component),
                ("$position", row.Position), ("$spec", row.Specification), ("$target", Decimal(row.TargetValue)),
                ("$actual", Decimal(row.ActualValue)), ("$min", Decimal(row.MinimumValue)), ("$max", Decimal(row.MaximumValue)),
                ("$unit", row.Unit), ("$method", row.Method), ("$instrument", row.Instrument), ("$source", row.Source),
                ("$notes", row.Notes), ("$sort", row.SortOrder)).ConfigureAwait(false);
        }

        foreach (var row in document.FastenerEvents)
        {
            await ExecuteAsync(connection, transaction, """
                INSERT INTO build_fastener_events VALUES ($id,$build,$group,$position,$manufacturer,$part,$cycle,$torque,$angle,$stretch,$lubricant,$procedure,$performed,$technician,$notes,$sort);
                """, token, ("$id", row.Id), ("$build", row.EngineBuildId), ("$group", row.FastenerGroup), ("$position", row.Position),
                ("$manufacturer", row.Manufacturer), ("$part", row.PartNumber), ("$cycle", row.InstallationCycle),
                ("$torque", Decimal(row.TorqueNm)), ("$angle", Decimal(row.AngleDegrees)), ("$stretch", Decimal(row.StretchMm)),
                ("$lubricant", row.Lubricant), ("$procedure", row.ProcedureSource), ("$performed", Date(row.PerformedUtc)),
                ("$technician", row.Technician), ("$notes", row.Notes), ("$sort", row.SortOrder)).ConfigureAwait(false);
        }

        foreach (var row in document.Hardware)
        {
            await ExecuteAsync(connection, transaction, """
                INSERT INTO build_hardware VALUES ($id,$build,$system,$type,$manufacturer,$model,$part,$serial,$rated,$unit,$calibration,$notes,$sort);
                """, token, ("$id", row.Id), ("$build", row.EngineBuildId), ("$system", row.System), ("$type", row.ComponentType),
                ("$manufacturer", row.Manufacturer), ("$model", row.Model), ("$part", row.PartNumber), ("$serial", row.SerialNumber),
                ("$rated", Decimal(row.RatedValue)), ("$unit", row.RatedUnit), ("$calibration", row.CalibrationData),
                ("$notes", row.Notes), ("$sort", row.SortOrder)).ConfigureAwait(false);
        }
    }

    private static async Task ExecuteAsync(SqliteConnection connection, SqliteTransaction? transaction, string sql, CancellationToken token, params (string Name, object? Value)[] parameters)
    {
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = sql;
        foreach (var parameter in parameters) command.Parameters.AddWithValue(parameter.Name, parameter.Value ?? DBNull.Value);
        await command.ExecuteNonQueryAsync(token).ConfigureAwait(false);
    }

    private static void Validate(EngineBuildDocument document)
    {
        if (document.Vehicle.CustomerId != document.Customer.Id) throw new InvalidDataException("Vehicle/customer relationship does not match.");
        if (document.Build.VehicleId != document.Vehicle.Id) throw new InvalidDataException("Build/vehicle relationship does not match.");
        if (document.Measurements.Any(row => row.EngineBuildId != document.Build.Id)
            || document.FastenerEvents.Any(row => row.EngineBuildId != document.Build.Id)
            || document.Hardware.Any(row => row.EngineBuildId != document.Build.Id))
        {
            throw new InvalidDataException("One or more build rows reference a different engine build.");
        }
    }

    private static CustomerProfile ReadCustomer(SqliteDataReader reader) => new(
        reader.GetString(reader.GetOrdinal("id")), reader.GetString(reader.GetOrdinal("display_name")),
        Text(reader, "company"), Text(reader, "email"), Text(reader, "phone"), Text(reader, "notes"),
        RequiredDate(reader, "created_utc"), RequiredDate(reader, "modified_utc"));

    private static VehicleProfile ReadVehicle(SqliteDataReader reader) => new(
        reader.GetString(reader.GetOrdinal("id")), reader.GetString(reader.GetOrdinal("customer_id")),
        reader.GetString(reader.GetOrdinal("display_name")), Text(reader, "vin"), NullableInt(reader, "model_year"),
        reader.GetString(reader.GetOrdinal("make")), reader.GetString(reader.GetOrdinal("model")), Text(reader, "chassis"),
        reader.GetString(reader.GetOrdinal("engine_family")), Text(reader, "transmission"), Text(reader, "odometer"), Text(reader, "notes"),
        RequiredDate(reader, "created_utc"), RequiredDate(reader, "modified_utc"));

    private static EngineBuildProfile ReadBuild(SqliteDataReader reader) => new(
        reader.GetString(reader.GetOrdinal("id")), reader.GetString(reader.GetOrdinal("vehicle_id")), reader.GetInt32(reader.GetOrdinal("revision")),
        reader.GetString(reader.GetOrdinal("name")), reader.GetString(reader.GetOrdinal("status")), reader.GetString(reader.GetOrdinal("engine_code")),
        reader.GetInt32(reader.GetOrdinal("cylinder_count")), reader.GetInt32(reader.GetOrdinal("main_journal_count")),
        Number(reader, "displacement_cc"), Number(reader, "bore_mm"), Number(reader, "stroke_mm"), Number(reader, "compression_ratio"),
        Text(reader, "block"), Text(reader, "cylinder_head"), Text(reader, "crankshaft"), Text(reader, "connecting_rods"), Text(reader, "pistons"),
        Text(reader, "head_gasket"), Number(reader, "head_gasket_thickness_mm"), Text(reader, "fuel"), Text(reader, "builder"),
        NullableDate(reader, "assembly_date_utc"), Text(reader, "notes"), RequiredDate(reader, "created_utc"), RequiredDate(reader, "modified_utc"));

    private static async Task<CustomerProfile?> ReadSingleCustomerAsync(SqliteConnection connection, string id, CancellationToken token)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM customers WHERE id=$id;";
        command.Parameters.AddWithValue("$id", id);
        await using var reader = await command.ExecuteReaderAsync(token).ConfigureAwait(false);
        return await reader.ReadAsync(token).ConfigureAwait(false) ? ReadCustomer(reader) : null;
    }

    private static async Task<VehicleProfile?> ReadSingleVehicleAsync(SqliteConnection connection, string id, CancellationToken token)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM vehicles WHERE id=$id;";
        command.Parameters.AddWithValue("$id", id);
        await using var reader = await command.ExecuteReaderAsync(token).ConfigureAwait(false);
        return await reader.ReadAsync(token).ConfigureAwait(false) ? ReadVehicle(reader) : null;
    }

    private static async Task<EngineBuildProfile?> ReadSingleBuildAsync(SqliteConnection connection, string id, CancellationToken token)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM engine_builds WHERE id=$id;";
        command.Parameters.AddWithValue("$id", id);
        await using var reader = await command.ExecuteReaderAsync(token).ConfigureAwait(false);
        return await reader.ReadAsync(token).ConfigureAwait(false) ? ReadBuild(reader) : null;
    }

    private static async Task<IReadOnlyList<BuildMeasurement>> ReadMeasurementsAsync(SqliteConnection connection, string buildId, CancellationToken token)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM build_measurements WHERE engine_build_id=$id ORDER BY sort_order;";
        command.Parameters.AddWithValue("$id", buildId);
        await using var reader = await command.ExecuteReaderAsync(token).ConfigureAwait(false);
        var rows = new List<BuildMeasurement>();
        while (await reader.ReadAsync(token).ConfigureAwait(false)) rows.Add(new BuildMeasurement(
            reader.GetString(0), reader.GetString(1), reader.GetString(2), reader.GetString(3), reader.GetString(4), reader.GetString(5),
            Number(reader, "target_value"), Number(reader, "actual_value"), Number(reader, "minimum_value"), Number(reader, "maximum_value"),
            reader.GetString(reader.GetOrdinal("unit")), Text(reader, "method"), Text(reader, "instrument"), Text(reader, "source"), Text(reader, "notes"),
            reader.GetInt32(reader.GetOrdinal("sort_order"))));
        return rows;
    }

    private static async Task<IReadOnlyList<BuildFastenerEvent>> ReadFastenersAsync(SqliteConnection connection, string buildId, CancellationToken token)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM build_fastener_events WHERE engine_build_id=$id ORDER BY sort_order;";
        command.Parameters.AddWithValue("$id", buildId);
        await using var reader = await command.ExecuteReaderAsync(token).ConfigureAwait(false);
        var rows = new List<BuildFastenerEvent>();
        while (await reader.ReadAsync(token).ConfigureAwait(false)) rows.Add(new BuildFastenerEvent(
            reader.GetString(0), reader.GetString(1), reader.GetString(2), reader.GetString(3), Text(reader, "manufacturer"), Text(reader, "part_number"),
            reader.GetInt32(reader.GetOrdinal("installation_cycle")), Number(reader, "torque_nm"), Number(reader, "angle_degrees"), Number(reader, "stretch_mm"),
            Text(reader, "lubricant"), Text(reader, "procedure_source"), NullableDate(reader, "performed_utc"), Text(reader, "technician"), Text(reader, "notes"),
            reader.GetInt32(reader.GetOrdinal("sort_order"))));
        return rows;
    }

    private static async Task<IReadOnlyList<BuildHardwareComponent>> ReadHardwareAsync(SqliteConnection connection, string buildId, CancellationToken token)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM build_hardware WHERE engine_build_id=$id ORDER BY sort_order;";
        command.Parameters.AddWithValue("$id", buildId);
        await using var reader = await command.ExecuteReaderAsync(token).ConfigureAwait(false);
        var rows = new List<BuildHardwareComponent>();
        while (await reader.ReadAsync(token).ConfigureAwait(false)) rows.Add(new BuildHardwareComponent(
            reader.GetString(0), reader.GetString(1), reader.GetString(2), reader.GetString(3), Text(reader, "manufacturer"), Text(reader, "model"),
            Text(reader, "part_number"), Text(reader, "serial_number"), Number(reader, "rated_value"), Text(reader, "rated_unit"),
            Text(reader, "calibration_data"), Text(reader, "notes"), reader.GetInt32(reader.GetOrdinal("sort_order"))));
        return rows;
    }

    private static string Date(DateTimeOffset value) => value.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture);
    private static string? Date(DateTimeOffset? value) => value.HasValue ? Date(value.Value) : null;
    private static string? Decimal(decimal? value) => value?.ToString(CultureInfo.InvariantCulture);
    private static string? Text(SqliteDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetString(reader.GetOrdinal(name));
    private static int? NullableInt(SqliteDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetInt32(reader.GetOrdinal(name));
    private static decimal? Number(SqliteDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : decimal.Parse(reader.GetString(reader.GetOrdinal(name)), CultureInfo.InvariantCulture);
    private static DateTimeOffset RequiredDate(SqliteDataReader reader, string name) => DateTimeOffset.Parse(reader.GetString(reader.GetOrdinal(name)), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);
    private static DateTimeOffset? NullableDate(SqliteDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : RequiredDate(reader, name);
}

BEGIN TRY

BEGIN TRAN;

-- CreateTable: policies
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[policies]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[policies] (
        [id] NVARCHAR(1000) NOT NULL,
        [tenant_id] NVARCHAR(1000) NOT NULL,
        [name] NVARCHAR(1000) NOT NULL,
        [type] NVARCHAR(1000) NOT NULL,
        [config] NVARCHAR(max) NOT NULL,
        [enabled] BIT NOT NULL CONSTRAINT [policies_enabled_df] DEFAULT 1,
        [created_at] DATETIME2 NOT NULL CONSTRAINT [policies_created_at_df] DEFAULT CURRENT_TIMESTAMP,
        [updated_at] DATETIME2 NOT NULL,
        CONSTRAINT [policies_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [policies_tenant_id_name_key] UNIQUE NONCLUSTERED ([tenant_id],[name])
    );
END

-- CreateTable: market_data
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[market_data]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[market_data] (
        [id] NVARCHAR(1000) NOT NULL,
        [type] NVARCHAR(1000) NOT NULL,
        [source] NVARCHAR(1000) NOT NULL,
        [data] NVARCHAR(max) NOT NULL,
        [date] DATETIME2 NOT NULL,
        [tenant_id] NVARCHAR(1000),
        [created_at] DATETIME2 NOT NULL CONSTRAINT [market_data_created_at_df] DEFAULT CURRENT_TIMESTAMP,
        [updated_at] DATETIME2 NOT NULL,
        CONSTRAINT [market_data_pkey] PRIMARY KEY CLUSTERED ([id])
    );
END

-- CreateTable: content_ingestion
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[content_ingestion]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[content_ingestion] (
        [id] NVARCHAR(1000) NOT NULL,
        [source_type] NVARCHAR(1000) NOT NULL,
        [status] NVARCHAR(1000) NOT NULL,
        [last_run] DATETIME2,
        [next_run] DATETIME2,
        [config] NVARCHAR(max) NOT NULL,
        [created_at] DATETIME2 NOT NULL CONSTRAINT [content_ingestion_created_at_df] DEFAULT CURRENT_TIMESTAMP,
        [updated_at] DATETIME2 NOT NULL,
        CONSTRAINT [content_ingestion_pkey] PRIMARY KEY CLUSTERED ([id])
    );
END

-- CreateTable: source_metadata
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[source_metadata]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[source_metadata] (
        [id] NVARCHAR(1000) NOT NULL,
        [source_id] NVARCHAR(1000) NOT NULL,
        [key] NVARCHAR(1000) NOT NULL,
        [value] NVARCHAR(max) NOT NULL,
        [created_at] DATETIME2 NOT NULL CONSTRAINT [source_metadata_created_at_df] DEFAULT CURRENT_TIMESTAMP,
        [updated_at] DATETIME2 NOT NULL,
        CONSTRAINT [source_metadata_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [source_metadata_source_id_key_key] UNIQUE NONCLUSTERED ([source_id],[key])
    );
END

-- CreateTable: house_views
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[house_views]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[house_views] (
        [id] NVARCHAR(1000) NOT NULL,
        [tenant_id] NVARCHAR(1000) NOT NULL,
        [title] NVARCHAR(1000) NOT NULL,
        [content] NVARCHAR(max) NOT NULL,
        [version] INT NOT NULL CONSTRAINT [house_views_version_df] DEFAULT 1,
        [is_active] BIT NOT NULL CONSTRAINT [house_views_is_active_df] DEFAULT 1,
        [created_at] DATETIME2 NOT NULL CONSTRAINT [house_views_created_at_df] DEFAULT CURRENT_TIMESTAMP,
        [updated_at] DATETIME2 NOT NULL,
        CONSTRAINT [house_views_pkey] PRIMARY KEY CLUSTERED ([id])
    );
END

-- CreateIndex: policies_tenant_id_type_idx
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'policies_tenant_id_type_idx' AND object_id = OBJECT_ID(N'[dbo].[policies]'))
BEGIN
    CREATE NONCLUSTERED INDEX [policies_tenant_id_type_idx] ON [dbo].[policies]([tenant_id], [type]);
END

-- CreateIndex: market_data_tenant_id_date_idx
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'market_data_tenant_id_date_idx' AND object_id = OBJECT_ID(N'[dbo].[market_data]'))
BEGIN
    CREATE NONCLUSTERED INDEX [market_data_tenant_id_date_idx] ON [dbo].[market_data]([tenant_id], [date]);
END

-- CreateIndex: market_data_type_date_idx
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'market_data_type_date_idx' AND object_id = OBJECT_ID(N'[dbo].[market_data]'))
BEGIN
    CREATE NONCLUSTERED INDEX [market_data_type_date_idx] ON [dbo].[market_data]([type], [date]);
END

-- CreateIndex: market_data_source_date_idx
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'market_data_source_date_idx' AND object_id = OBJECT_ID(N'[dbo].[market_data]'))
BEGIN
    CREATE NONCLUSTERED INDEX [market_data_source_date_idx] ON [dbo].[market_data]([source], [date]);
END

-- CreateIndex: content_ingestion_source_type_status_idx
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'content_ingestion_source_type_status_idx' AND object_id = OBJECT_ID(N'[dbo].[content_ingestion]'))
BEGIN
    CREATE NONCLUSTERED INDEX [content_ingestion_source_type_status_idx] ON [dbo].[content_ingestion]([source_type], [status]);
END

-- CreateIndex: content_ingestion_next_run_idx
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'content_ingestion_next_run_idx' AND object_id = OBJECT_ID(N'[dbo].[content_ingestion]'))
BEGIN
    CREATE NONCLUSTERED INDEX [content_ingestion_next_run_idx] ON [dbo].[content_ingestion]([next_run]);
END

-- CreateIndex: source_metadata_source_id_idx
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'source_metadata_source_id_idx' AND object_id = OBJECT_ID(N'[dbo].[source_metadata]'))
BEGIN
    CREATE NONCLUSTERED INDEX [source_metadata_source_id_idx] ON [dbo].[source_metadata]([source_id]);
END

-- CreateIndex: house_views_tenant_id_is_active_idx
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'house_views_tenant_id_is_active_idx' AND object_id = OBJECT_ID(N'[dbo].[house_views]'))
BEGIN
    CREATE NONCLUSTERED INDEX [house_views_tenant_id_is_active_idx] ON [dbo].[house_views]([tenant_id], [is_active]);
END

-- AddForeignKey: policies_tenant_id_fkey
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'policies_tenant_id_fkey')
BEGIN
    ALTER TABLE [dbo].[policies] ADD CONSTRAINT [policies_tenant_id_fkey] FOREIGN KEY ([tenant_id]) REFERENCES [dbo].[tenants]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
END

-- AddForeignKey: market_data_tenant_id_fkey
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'market_data_tenant_id_fkey')
BEGIN
    ALTER TABLE [dbo].[market_data] ADD CONSTRAINT [market_data_tenant_id_fkey] FOREIGN KEY ([tenant_id]) REFERENCES [dbo].[tenants]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
END

-- AddForeignKey: source_metadata_source_id_fkey
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'source_metadata_source_id_fkey')
BEGIN
    ALTER TABLE [dbo].[source_metadata] ADD CONSTRAINT [source_metadata_source_id_fkey] FOREIGN KEY ([source_id]) REFERENCES [dbo].[content_sources]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
END

-- AddForeignKey: house_views_tenant_id_fkey
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'house_views_tenant_id_fkey')
BEGIN
    ALTER TABLE [dbo].[house_views] ADD CONSTRAINT [house_views_tenant_id_fkey] FOREIGN KEY ([tenant_id]) REFERENCES [dbo].[tenants]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
END

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[tenants] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [logo_url] NVARCHAR(1000),
    [primary_color] NVARCHAR(1000) NOT NULL CONSTRAINT [tenants_primary_color_df] DEFAULT '#000000',
    [secondary_color] NVARCHAR(1000) NOT NULL CONSTRAINT [tenants_secondary_color_df] DEFAULT '#666666',
    [font_family] NVARCHAR(1000),
    [domain] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [tenants_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [tenants_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [tenants_domain_key] UNIQUE NONCLUSTERED ([domain])
);

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenant_id] NVARCHAR(1000),
    [azure_ad_id] NVARCHAR(1000),
    [name] NVARCHAR(1000),
    [email] NVARCHAR(1000) NOT NULL,
    [email_verified] DATETIME2,
    [image] NVARCHAR(max),
    [role] NVARCHAR(1000),
    [language] NVARCHAR(1000) CONSTRAINT [users_language_df] DEFAULT 'en',
    [generation] NVARCHAR(1000),
    [sophistication_level] NVARCHAR(1000),
    [preferences] NVARCHAR(1000) CONSTRAINT [users_preferences_df] DEFAULT '{}',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [users_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_azure_ad_id_key] UNIQUE NONCLUSTERED ([azure_ad_id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[accounts] (
    [id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [provider] NVARCHAR(1000) NOT NULL,
    [provider_account_id] NVARCHAR(1000) NOT NULL,
    [refresh_token] NVARCHAR(max),
    [access_token] NVARCHAR(max),
    [expires_at] INT,
    [token_type] NVARCHAR(1000),
    [scope] NVARCHAR(max),
    [id_token] NVARCHAR(max),
    [session_state] NVARCHAR(1000),
    [ext_expires_in] INT,
    CONSTRAINT [accounts_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [accounts_provider_provider_account_id_key] UNIQUE NONCLUSTERED ([provider],[provider_account_id])
);

-- CreateTable
CREATE TABLE [dbo].[sessions] (
    [id] NVARCHAR(1000) NOT NULL,
    [session_token] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [sessions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [sessions_session_token_key] UNIQUE NONCLUSTERED ([session_token])
);

-- CreateTable
CREATE TABLE [dbo].[verification_tokens] (
    [identifier] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [verification_tokens_token_key] UNIQUE NONCLUSTERED ([token]),
    CONSTRAINT [verification_tokens_identifier_token_key] UNIQUE NONCLUSTERED ([identifier],[token])
);

-- CreateTable
CREATE TABLE [dbo].[briefings] (
    [id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [tenant_id] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [generated_at] DATETIME2 NOT NULL CONSTRAINT [briefings_generated_at_df] DEFAULT CURRENT_TIMESTAMP,
    [week_start_date] DATETIME2 NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [briefings_status_df] DEFAULT 'draft',
    [version] INT NOT NULL CONSTRAINT [briefings_version_df] DEFAULT 1,
    [reviewer_id] NVARCHAR(1000),
    [reviewed_at] DATETIME2,
    [citations] NVARCHAR(max),
    [risk_score] FLOAT(53),
    [requires_review] BIT NOT NULL CONSTRAINT [briefings_requires_review_df] DEFAULT 0,
    CONSTRAINT [briefings_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[explainers] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenant_id] NVARCHAR(1000) NOT NULL,
    [topic] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [language] NVARCHAR(1000) NOT NULL CONSTRAINT [explainers_language_df] DEFAULT 'en',
    [generated_at] DATETIME2 NOT NULL CONSTRAINT [explainers_generated_at_df] DEFAULT CURRENT_TIMESTAMP,
    [cached] BIT NOT NULL CONSTRAINT [explainers_cached_df] DEFAULT 1,
    [citations] NVARCHAR(max),
    [risk_score] FLOAT(53),
    [requires_review] BIT NOT NULL CONSTRAINT [explainers_requires_review_df] DEFAULT 0,
    CONSTRAINT [explainers_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [explainers_tenant_id_topic_language_key] UNIQUE NONCLUSTERED ([tenant_id],[topic],[language])
);

-- CreateTable
CREATE TABLE [dbo].[lessons] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenant_id] NVARCHAR(1000) NOT NULL,
    [topic] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [generation] NVARCHAR(1000),
    [language] NVARCHAR(1000) NOT NULL CONSTRAINT [lessons_language_df] DEFAULT 'en',
    [sophistication_level] NVARCHAR(1000),
    [generated_at] DATETIME2 NOT NULL CONSTRAINT [lessons_generated_at_df] DEFAULT CURRENT_TIMESTAMP,
    [citations] NVARCHAR(max),
    [risk_score] FLOAT(53),
    [requires_review] BIT NOT NULL CONSTRAINT [lessons_requires_review_df] DEFAULT 0,
    CONSTRAINT [lessons_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[user_preferences] (
    [id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [topic] NVARCHAR(1000) NOT NULL,
    [interest_level] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [user_preferences_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [user_preferences_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [user_preferences_user_id_topic_key] UNIQUE NONCLUSTERED ([user_id],[topic])
);

-- CreateTable
CREATE TABLE [dbo].[content_reviews] (
    [id] NVARCHAR(1000) NOT NULL,
    [content_id] NVARCHAR(1000) NOT NULL,
    [content_type] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [reviewer_id] NVARCHAR(1000),
    [reviewed_at] DATETIME2,
    [comments] NVARCHAR(max),
    [version] INT NOT NULL CONSTRAINT [content_reviews_version_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [content_reviews_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [content_reviews_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[content_sources] (
    [id] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [url] NVARCHAR(max),
    [date] DATETIME2,
    [reliability_score] FLOAT(53),
    [tags] NVARCHAR(max),
    [tenant_id] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [content_sources_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [content_sources_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[citations] (
    [id] NVARCHAR(1000) NOT NULL,
    [content_id] NVARCHAR(1000) NOT NULL,
    [content_type] NVARCHAR(1000) NOT NULL,
    [source_id] NVARCHAR(1000),
    [text] NVARCHAR(max) NOT NULL,
    [confidence_score] FLOAT(53) NOT NULL,
    [position] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [citations_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [citations_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[content_versions] (
    [id] NVARCHAR(1000) NOT NULL,
    [content_id] NVARCHAR(1000) NOT NULL,
    [content_type] NVARCHAR(1000) NOT NULL,
    [version] INT NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [generated_at] DATETIME2 NOT NULL CONSTRAINT [content_versions_generated_at_df] DEFAULT CURRENT_TIMESTAMP,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [content_versions_status_df] DEFAULT 'draft',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [content_versions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [content_versions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [content_versions_content_id_content_type_version_key] UNIQUE NONCLUSTERED ([content_id],[content_type],[version])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [accounts_user_id_idx] ON [dbo].[accounts]([user_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [sessions_user_id_idx] ON [dbo].[sessions]([user_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [briefings_user_id_week_start_date_idx] ON [dbo].[briefings]([user_id], [week_start_date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [briefings_tenant_id_week_start_date_idx] ON [dbo].[briefings]([tenant_id], [week_start_date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [briefings_status_idx] ON [dbo].[briefings]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [explainers_tenant_id_topic_idx] ON [dbo].[explainers]([tenant_id], [topic]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [explainers_risk_score_idx] ON [dbo].[explainers]([risk_score]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [lessons_tenant_id_generation_language_idx] ON [dbo].[lessons]([tenant_id], [generation], [language]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [lessons_tenant_id_topic_idx] ON [dbo].[lessons]([tenant_id], [topic]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [lessons_risk_score_idx] ON [dbo].[lessons]([risk_score]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [user_preferences_user_id_idx] ON [dbo].[user_preferences]([user_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [content_reviews_content_id_content_type_idx] ON [dbo].[content_reviews]([content_id], [content_type]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [content_reviews_status_idx] ON [dbo].[content_reviews]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [content_reviews_reviewer_id_idx] ON [dbo].[content_reviews]([reviewer_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [content_sources_tenant_id_idx] ON [dbo].[content_sources]([tenant_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [content_sources_type_idx] ON [dbo].[content_sources]([type]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [citations_content_id_content_type_idx] ON [dbo].[citations]([content_id], [content_type]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [citations_source_id_idx] ON [dbo].[citations]([source_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [content_versions_content_id_content_type_idx] ON [dbo].[content_versions]([content_id], [content_type]);

-- AddForeignKey
ALTER TABLE [dbo].[users] ADD CONSTRAINT [users_tenant_id_fkey] FOREIGN KEY ([tenant_id]) REFERENCES [dbo].[tenants]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[accounts] ADD CONSTRAINT [accounts_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[sessions] ADD CONSTRAINT [sessions_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[briefings] ADD CONSTRAINT [briefings_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[briefings] ADD CONSTRAINT [briefings_tenant_id_fkey] FOREIGN KEY ([tenant_id]) REFERENCES [dbo].[tenants]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[briefings] ADD CONSTRAINT [briefings_reviewer_id_fkey] FOREIGN KEY ([reviewer_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[explainers] ADD CONSTRAINT [explainers_tenant_id_fkey] FOREIGN KEY ([tenant_id]) REFERENCES [dbo].[tenants]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[lessons] ADD CONSTRAINT [lessons_tenant_id_fkey] FOREIGN KEY ([tenant_id]) REFERENCES [dbo].[tenants]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_preferences] ADD CONSTRAINT [user_preferences_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[content_reviews] ADD CONSTRAINT [content_reviews_reviewer_id_fkey] FOREIGN KEY ([reviewer_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[content_sources] ADD CONSTRAINT [content_sources_tenant_id_fkey] FOREIGN KEY ([tenant_id]) REFERENCES [dbo].[tenants]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[citations] ADD CONSTRAINT [citations_source_id_fkey] FOREIGN KEY ([source_id]) REFERENCES [dbo].[content_sources]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH


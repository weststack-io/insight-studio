BEGIN TRY

BEGIN TRAN;

-- CreateTable: analytics_events
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[analytics_events]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[analytics_events] (
        [id] NVARCHAR(1000) NOT NULL,
        [tenant_id] NVARCHAR(1000) NOT NULL,
        [user_id] NVARCHAR(1000) NOT NULL,
        [content_id] NVARCHAR(1000),
        [content_type] NVARCHAR(1000),
        [event_type] NVARCHAR(1000) NOT NULL,
        [metadata] NVARCHAR(max),
        [session_id] NVARCHAR(1000),
        [created_at] DATETIME2 NOT NULL CONSTRAINT [analytics_events_created_at_df] DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT [analytics_events_pkey] PRIMARY KEY CLUSTERED ([id])
    );
END

-- CreateTable: engagement_metrics
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[engagement_metrics]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[engagement_metrics] (
        [id] NVARCHAR(1000) NOT NULL,
        [tenant_id] NVARCHAR(1000) NOT NULL,
        [content_id] NVARCHAR(1000) NOT NULL,
        [content_type] NVARCHAR(1000) NOT NULL,
        [total_opens] INT NOT NULL CONSTRAINT [engagement_metrics_total_opens_df] DEFAULT 0,
        [unique_opens] INT NOT NULL CONSTRAINT [engagement_metrics_unique_opens_df] DEFAULT 0,
        [avg_dwell_time] FLOAT(53) NOT NULL CONSTRAINT [engagement_metrics_avg_dwell_time_df] DEFAULT 0,
        [avg_scroll_depth] FLOAT(53) NOT NULL CONSTRAINT [engagement_metrics_avg_scroll_depth_df] DEFAULT 0,
        [completion_rate] FLOAT(53) NOT NULL CONSTRAINT [engagement_metrics_completion_rate_df] DEFAULT 0,
        [avg_rating] FLOAT(53),
        [total_feedback] INT NOT NULL CONSTRAINT [engagement_metrics_total_feedback_df] DEFAULT 0,
        [engagement_score] FLOAT(53) NOT NULL CONSTRAINT [engagement_metrics_engagement_score_df] DEFAULT 0,
        [last_engaged_at] DATETIME2,
        [created_at] DATETIME2 NOT NULL CONSTRAINT [engagement_metrics_created_at_df] DEFAULT CURRENT_TIMESTAMP,
        [updated_at] DATETIME2 NOT NULL,
        CONSTRAINT [engagement_metrics_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [engagement_metrics_content_id_content_type_key] UNIQUE NONCLUSTERED ([content_id],[content_type])
    );
END

-- CreateTable: preference_learning_log
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[preference_learning_log]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[preference_learning_log] (
        [id] NVARCHAR(1000) NOT NULL,
        [user_id] NVARCHAR(1000) NOT NULL,
        [topic] NVARCHAR(1000) NOT NULL,
        [previous_level] NVARCHAR(1000) NOT NULL,
        [new_level] NVARCHAR(1000) NOT NULL,
        [reason] NVARCHAR(max) NOT NULL,
        [confidence] FLOAT(53) NOT NULL,
        [applied_at] DATETIME2 NOT NULL CONSTRAINT [preference_learning_log_applied_at_df] DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT [preference_learning_log_pkey] PRIMARY KEY CLUSTERED ([id])
    );
END

-- CreateIndex: analytics_events_tenant_id_user_id_idx
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'analytics_events_tenant_id_user_id_idx' AND object_id = OBJECT_ID(N'[dbo].[analytics_events]'))
BEGIN
    CREATE NONCLUSTERED INDEX [analytics_events_tenant_id_user_id_idx] ON [dbo].[analytics_events]([tenant_id], [user_id]);
END

-- CreateIndex: analytics_events_tenant_id_content_id_content_type_idx
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'analytics_events_tenant_id_content_id_content_type_idx' AND object_id = OBJECT_ID(N'[dbo].[analytics_events]'))
BEGIN
    CREATE NONCLUSTERED INDEX [analytics_events_tenant_id_content_id_content_type_idx] ON [dbo].[analytics_events]([tenant_id], [content_id], [content_type]);
END

-- CreateIndex: analytics_events_event_type_created_at_idx
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'analytics_events_event_type_created_at_idx' AND object_id = OBJECT_ID(N'[dbo].[analytics_events]'))
BEGIN
    CREATE NONCLUSTERED INDEX [analytics_events_event_type_created_at_idx] ON [dbo].[analytics_events]([event_type], [created_at]);
END

-- CreateIndex: analytics_events_session_id_idx
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'analytics_events_session_id_idx' AND object_id = OBJECT_ID(N'[dbo].[analytics_events]'))
BEGIN
    CREATE NONCLUSTERED INDEX [analytics_events_session_id_idx] ON [dbo].[analytics_events]([session_id]);
END

-- CreateIndex: engagement_metrics_tenant_id_content_type_idx
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'engagement_metrics_tenant_id_content_type_idx' AND object_id = OBJECT_ID(N'[dbo].[engagement_metrics]'))
BEGIN
    CREATE NONCLUSTERED INDEX [engagement_metrics_tenant_id_content_type_idx] ON [dbo].[engagement_metrics]([tenant_id], [content_type]);
END

-- CreateIndex: engagement_metrics_engagement_score_idx
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'engagement_metrics_engagement_score_idx' AND object_id = OBJECT_ID(N'[dbo].[engagement_metrics]'))
BEGIN
    CREATE NONCLUSTERED INDEX [engagement_metrics_engagement_score_idx] ON [dbo].[engagement_metrics]([engagement_score]);
END

-- CreateIndex: preference_learning_log_user_id_idx
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'preference_learning_log_user_id_idx' AND object_id = OBJECT_ID(N'[dbo].[preference_learning_log]'))
BEGIN
    CREATE NONCLUSTERED INDEX [preference_learning_log_user_id_idx] ON [dbo].[preference_learning_log]([user_id]);
END

-- CreateIndex: preference_learning_log_applied_at_idx
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'preference_learning_log_applied_at_idx' AND object_id = OBJECT_ID(N'[dbo].[preference_learning_log]'))
BEGIN
    CREATE NONCLUSTERED INDEX [preference_learning_log_applied_at_idx] ON [dbo].[preference_learning_log]([applied_at]);
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


-- Migration: Add application_name field to tenants table
-- Sets default value to 'Insight Studio' for all existing tenants

BEGIN TRY
BEGIN TRAN;

-- Add application_name column to tenants table
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.tenants') 
    AND name = 'application_name'
)
BEGIN
    ALTER TABLE [dbo].[tenants]
    ADD [application_name] NVARCHAR(1000) NULL;
    
    PRINT 'Added application_name column to tenants table';
END
ELSE
BEGIN
    PRINT 'application_name column already exists';
END

-- Update all existing tenants to set application_name to 'Insight Studio' if not already set
UPDATE [dbo].[tenants]
SET [application_name] = 'Insight Studio'
WHERE [application_name] IS NULL;

PRINT 'Updated existing tenants with default application_name';

COMMIT TRAN;
PRINT 'Migration completed successfully';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;

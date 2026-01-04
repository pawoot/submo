-- Add unique constraint to name column
ALTER TABLE subscription_templates 
ADD CONSTRAINT subscription_templates_name_key UNIQUE (name);
module "parameter_store_internal_configuration" {
  source = "./modules/parameter-store"

  namespace   = local.prefix
  kms_key_arn = aws_kms_key.main.arn

  // Update values in place based on supplied values
  update_values = true

  parameters = {
    // Elasticache config
    "config/common/cache/name" = aws_elasticache_serverless_cache.this.name
    "config/common/cache/host" = aws_elasticache_serverless_cache.this.endpoint[0].address
    "config/common/cache/user" = aws_elasticache_user.this.user_name

  }
}

module "parameter_store_external_configuration" {
  source = "./modules/parameter-store"

  namespace   = local.prefix
  kms_key_arn = aws_kms_key.main.arn

  // Values are created with placeholder and developers are expected to manually update them externally
  update_values = false

  parameters = {
    "config/common/enabled"          = "true"
    "config/OrdinanceSurvey/ApiKey"  = ""
    "config/OrdinanceSurvey/BaseUrl" = ""

    # Temporary key

  }
}

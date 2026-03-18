module "lambda_lgdi_getSchedule" {
  source        = "./modules/lambda"
  prefix        = local.prefix
  region        = var.region
  service_name  = ""
  function_name = "getSchedule"

  # Using code signing 
  kms_key_arn            = aws_kms_key.main.arn
  bundle_path            = "../dist/lambdas/http.getSchedule"
  s3_bucket_id           = aws_s3_bucket.code_storage.id
  codesigning_config_id  = aws_lambda_code_signing_config.code_signing.id
  codesigning_profile_id = aws_signer_signing_profile.code_signing.id
}

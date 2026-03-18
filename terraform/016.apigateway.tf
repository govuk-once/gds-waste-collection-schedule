
module "api_gateway_lgdi" {
  source = "./modules/apigateway"
  // Metadata
  name       = "lgdi"
  prefix     = local.prefix
  region     = var.region
  stage_name = "api"

  // Config
  kms_key_arn = aws_kms_key.main.arn

  // Lambdas
  integrations = {
    "getHealthcheck" = {
      path                 = "status"
      method               = "GET"
      lambda_function_name = module.lambda_lgdi_getHealthcheck.lambda_function_name
      lambda_invoke_arn    = module.lambda_lgdi_getHealthcheck.lambda_invoke_arn
    },
    "getAddressesByPostcode" = {
      path                 = "address/{postcode}"
      method               = "GET"
      lambda_function_name = module.lambda_lgdi_getAddressesByPostcode.lambda_function_name
      lambda_invoke_arn    = module.lambda_lgdi_getAddressesByPostcode.lambda_invoke_arn
    },
    "getSchedule" = {
      path                 = "schedule"
      method               = "GET"
      lambda_function_name = module.lambda_lgdi_getSchedule.lambda_function_name
      lambda_invoke_arn    = module.lambda_lgdi_getSchedule.lambda_invoke_arn
    }
  }
}

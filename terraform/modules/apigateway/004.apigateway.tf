locals {
  api_ops_by_path = tomap({
    for op in var.integrations : op.path => op...
  })
}

# Create Gateway
resource "aws_api_gateway_rest_api" "this" {
  name = join("-", [var.prefix, "apigw", var.name])

  disable_execute_api_endpoint = var.disable_execute_api_endpoint

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  lifecycle {
    create_before_destroy = true
  }

  fail_on_warnings = true

  // Dynamically build out openapi spec from integration definitions
  body = jsonencode({
    openapi = "3.0.1"
    info = {
      title   = var.name
      version = "1.0"
    }
    paths = {
      for path, ops in local.api_ops_by_path : path => {
        for op in ops : lower(op.method) => {
          security = op.authorizer == null ? [] : [{ (op.authorizer) = [] }]
          x-amazon-apigateway-integration = {
            uri                  = op.lambda_invoke_arn
            httpMethod           = op.method
            connectionType       = "INTERNET"
            httpMethod           = "POST"
            payloadFormatVersion = "2.0"
            type                 = "aws_proxy"
          }
        }
      }
    }
  })
}

# API Gateway permission for execution of lambdas during event handling
resource "aws_lambda_permission" "apigw" {
  for_each      = var.integrations
  statement_id  = "AllowAPIGatewayInvoke-${aws_api_gateway_rest_api.this.id}-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.lambda_function_name
  principal     = "apigateway.amazonaws.com"

  # The /*/* portion grants access from any api call within API Gateway within any stage
  source_arn = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

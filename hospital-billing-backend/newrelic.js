'use strict';

/**
 * New Relic agent configuration.
 *
 * See lib/config/default.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
  /**
   * Array of application names.
   */
  app_name: ['Hospital Billing System'],

  /**
   * Your New Relic license key.
   */
  license_key: process.env.NEW_RELIC_LICENSE_KEY || 'your-license-key-here',

  /**
   * This setting controls distributed tracing.
   * Distributed tracing lets you see the path that a request takes through your
   * distributed system. Enabling distributed tracing changes the behavior of some
   * New Relic features, so carefully consult the transition guide before you enable
   * this feature: https://docs.newrelic.com/docs/transition-guide-distributed-tracing
   * Default is true.
   */
  distributed_tracing: {
    /**
     * Enables/disables distributed tracing.
     *
     * @env NEW_RELIC_DISTRIBUTED_TRACING_ENABLED
     */
    enabled: true,
  },

  /**
   * When true, all request headers except for those listed in attributes.exclude
   * will be captured for all traces, unless otherwise specified in a destination's
   * attributes include/exclude lists.
   */
  allow_all_headers: true,

  /**
   * Attributes are key-value pairs that can be used to provide additional
   * information about a transaction or error. Some attributes are automatically
   * added by the agent, and custom attributes can be added by calling
   * `recordCustomAttribute()` or `recordCustomEvent()`.
   */
  attributes: {
    /**
     * Prefix of attributes to exclude from all destinations. Allows * as wildcard
     * at end of prefix.
     *
     * @env NEW_RELIC_ATTRIBUTES_EXCLUDE
     */
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*',
    ],
  },

  /**
   * Transaction tracer enables capture of detailed transaction traces. When
   * disabled, the agent will only capture basic transaction information.
   */
  transaction_tracer: {
    /**
     * Transaction tracer is enabled by default. Set to false to disable.
     *
     * @env NEW_RELIC_TRANSACTION_TRACER_ENABLED
     */
    enabled: true,

    /**
     * Transaction threshold is the response time in seconds below which a
     * transaction trace will not be recorded. Default is 4.0 seconds.
     *
     * @env NEW_RELIC_TRANSACTION_TRACER_THRESHOLD
     */
    threshold: 4.0,

    /**
     * When transaction tracer is on, the agent will capture the stack traces
     * for the top 20 slowest transactions. Set to 0 to disable stack trace
     * capture.
     *
     * @env NEW_RELIC_TRANSACTION_TRACER_STACK_TRACE_THRESHOLD
     */
    stack_trace_threshold: 0.5,

    /**
     * Determines whether the agent captures query parameters for database
     * queries. Default is false.
     *
     * @env NEW_RELIC_TRANSACTION_TRACER_RECORD_SQL
     */
    record_sql: 'obfuscated',

    /**
     * Set to true to log slow queries. Default is false.
     *
     * @env NEW_RELIC_TRANSACTION_TRACER_EXPLAIN_THRESHOLD
     */
    explain_threshold: 0.5,

    /**
     * Set to true to log all queries. Default is false.
     *
     * @env NEW_RELIC_TRANSACTION_TRACER_LOG_QUERIES
     */
    log_queries: false,
  },

  /**
   * Error collector captures and reports errors that occur in your application.
   */
  error_collector: {
    /**
     * Error collector is enabled by default. Set to false to disable.
     *
     * @env NEW_RELIC_ERROR_COLLECTOR_ENABLED
     */
    enabled: true,

    /**
     * List of error messages to ignore. Can be exact string or regex pattern.
     *
     * @env NEW_RELIC_ERROR_COLLECTOR_IGNORE_ERRORS
     */
    ignore_errors: [],
  },

  /**
   * Browser monitoring gives you insight into the performance of your application's
   * client-side code.
   */
  browser_monitoring: {
    /**
     * Browser monitoring is enabled by default. Set to false to disable.
     *
     * @env NEW_RELIC_BROWSER_MONITORING_ENABLED
     */
    enabled: true,
  },

  /**
   * Host display name.
   *
   * @env NEW_RELIC_HOST_DISPLAY_NAME
   */
  host_display_name:
    process.env.NEW_RELIC_HOST_DISPLAY_NAME || 'Hospital Billing Backend',

  /**
   * Application logging allows you to send log records to New Relic.
   */
  application_logging: {
    /**
     * Toggles all application logging features. Default is true.
     *
     * @env NEW_RELIC_APPLICATION_LOGGING_ENABLED
     */
    enabled: true,

    /**
     * When true, the agent will collect log records that are sent to the console
     * (stdout/stderr) and send them to New Relic. Default is true.
     *
     * @env NEW_RELIC_APPLICATION_LOGGING_FORWARDING_ENABLED
     */
    forwarding: {
      /**
       * Toggles the collection of log records from the console and forwarding them
       * to New Relic. Default is true.
       */
      enabled: true,
    },

    /**
     * When true, the agent will collect log records that are sent to the console
     * (stdout/stderr) and send them to New Relic. Default is true.
     *
     * @env NEW_RELIC_APPLICATION_LOGGING_METRICS_ENABLED
     */
    metrics: {
      /**
       * Toggles the collection of log records from the console and forwarding them
       * to New Relic. Default is true.
       */
      enabled: true,
    },
  },

  /**
   * Proxy settings for connecting to the New Relic collector.
   */
  proxy: {
    /**
     * Proxy hostname or IP address.
     *
     * @env NEW_RELIC_PROXY_HOST
     */
    host: process.env.NEW_RELIC_PROXY_HOST,

    /**
     * Proxy port.
     *
     * @env NEW_RELIC_PROXY_PORT
     */
    port: process.env.NEW_RELIC_PROXY_PORT,

    /**
     * Proxy username.
     *
     * @env NEW_RELIC_PROXY_USER
     */
    user: process.env.NEW_RELIC_PROXY_USER,

    /**
     * Proxy password.
     *
     * @env NEW_RELIC_PROXY_PASS
     */
    pass: process.env.NEW_RELIC_PROXY_PASS,
  },

  /**
   * SSL configuration for connecting to the New Relic collector.
   */
  ssl: true,

  /**
   * Ignore certain error codes when reporting errors to New Relic.
   *
   * @env NEW_RELIC_IGNORED_ERROR_CODES
   */
  ignored_error_codes: [],

  /**
   * Logging level for log messages.
   *
   * @env NEW_RELIC_LOGGING_LEVEL
   */
  logging: {
    level: process.env.NEW_RELIC_LOGGING_LEVEL || 'info',
  },

  /**
   * Transaction naming rules.
   */
  transaction_name_rules: [
    {
      pattern: '^/api/v1/patients/([^/]+)',
      name: 'Patients API - Individual Patient',
    },
    {
      pattern: '^/api/v1/billing/([^/]+)',
      name: 'Billing API - Individual Invoice',
    },
    {
      pattern: '^/api/v1/appointments/([^/]+)',
      name: 'Appointments API - Individual Appointment',
    },
    {
      pattern: '^/api/v1/paystack/([^/]+)',
      name: 'Paystack API - Individual Operation',
    },
  ],

  /**
   * Custom instrumentation rules.
   */
  custom_instrumentation: {
    enabled: true,
  },
};

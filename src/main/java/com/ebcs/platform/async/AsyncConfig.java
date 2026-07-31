package com.ebcs.platform.async;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/** Enables @Async event listeners so notifications don't block business transactions. */
@Configuration
@EnableAsync
public class AsyncConfig { }

package com.husc.timemanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO) // Thêm dòng này
@SpringBootApplication
public class TimeManagerApplication {

	public static void main(String[] args) {
		SpringApplication.run(TimeManagerApplication.class, args);
	}

}

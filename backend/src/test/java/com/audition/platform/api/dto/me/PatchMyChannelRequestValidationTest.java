package com.audition.platform.api.dto.me;

import com.audition.platform.application.me.ChannelShownFields;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;

class PatchMyChannelRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void allShownFieldKeysCanBePublic() {
        PatchMyChannelRequest req = new PatchMyChannelRequest();
        req.setShownFields(new ArrayList<>(ChannelShownFields.KEYS));
        assertThat(validator.validate(req)).isEmpty();
    }
}

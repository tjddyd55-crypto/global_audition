package com.audition.platform.application.i18n.translation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

/** 테스트용 HTTP. 루프백으로 나가지 않는다. */
public final class ScriptedTranslationTransport implements TranslationHttpTransport {

    public final List<Call> calls = new ArrayList<>();
    private final Deque<Handler> handlers = new ArrayDeque<>();
    private final ObjectMapper mapper = new ObjectMapper();

    public record Call(String kind, String url, String bearer, String body) {
    }

    @FunctionalInterface
    public interface Handler {
        TranslationHttpResult handle(Call call);
    }

    public void respond(int status, String body) {
        handlers.add(call -> new TranslationHttpResult(status, body));
    }

    public void fail(RuntimeException exception) {
        handlers.add(call -> {
            throw exception;
        });
    }

    public void echoTranslations(String prefix) {
        handlers.add(call -> {
            try {
                JsonNode root = mapper.readTree(call.body());
                ObjectNode response = mapper.createObjectNode();
                ArrayNode translations = response.putArray("translations");
                for (JsonNode item : root.withArray("contents")) {
                    translations.addObject().put("translatedText", prefix + item.asText());
                }
                return new TranslationHttpResult(200, mapper.writeValueAsString(response));
            } catch (Exception ex) {
                throw new IllegalStateException(ex);
            }
        });
    }

    public void clear() {
        calls.clear();
        handlers.clear();
    }

    @Override
    public TranslationHttpResult postJson(String url, String bearerToken, String jsonBody) {
        return next("POST", url, bearerToken, jsonBody);
    }

    @Override
    public TranslationHttpResult postForm(String url, String formBody) {
        return next("FORM", url, null, formBody);
    }

    @Override
    public TranslationHttpResult get(String url, String bearerToken) {
        return next("GET", url, bearerToken, null);
    }

    private TranslationHttpResult next(String kind, String url, String bearer, String body) {
        Call call = new Call(kind, url, bearer, body);
        calls.add(call);
        if (handlers.isEmpty()) {
            throw new IllegalStateException("no scripted response for " + kind);
        }
        return handlers.removeFirst().handle(call);
    }
}

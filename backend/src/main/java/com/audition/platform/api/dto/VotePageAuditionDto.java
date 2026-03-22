package com.audition.platform.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class VotePageAuditionDto {

    private String id;
    private String title;
    private String description;
    private long applicantCount;
    private long totalVotes;
    private List<CategoryCountDto> categories = new ArrayList<>();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public long getApplicantCount() {
        return applicantCount;
    }

    public void setApplicantCount(long applicantCount) {
        this.applicantCount = applicantCount;
    }

    public long getTotalVotes() {
        return totalVotes;
    }

    public void setTotalVotes(long totalVotes) {
        this.totalVotes = totalVotes;
    }

    public List<CategoryCountDto> getCategories() {
        return categories;
    }

    public void setCategories(List<CategoryCountDto> categories) {
        this.categories = categories != null ? categories : new ArrayList<>();
    }
}

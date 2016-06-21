package dbclient

import (
	"context"
	"fmt"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"log"
	"regexp"
	"time"
)

type (
	User struct {
		Email           string         `json:"email" bson:"email"`
		Password        []byte         `json:"password" bson:"password"`
		IsEmailVerified bool           `json:"isEmailVerified" bson:"isEmailVerified"`
		Github          *GithubDetails `json:"github" bson:"github"`
		CreatedAt       time.Time      `json:"createdAt" bson:"createdAt"`
	}

	GithubDetails struct {
		Id          string `json:"id" bson:"id"`
		DatabaseId  uint   `json:"databaseId" bson:"databaseId"`
		AccessToken []byte `json:"accessToken" bson:"accessToken"`
		Username    string `json:"username" bson:"username"`
		AvatarURL   string `json:"avatarURL" bson:"avatarURL"`
	}

	SessionDTO struct {
		Sid             string    `json:"sid"`
		Email           string    `json:"email"`
		GithubAuthState string    `json:"githubAuthState" bson:"githubAuthState"`
		CreatedAt       time.Time `json:"createdAt" bson:"createdAt"`
		ExpiresAt       time.Time `json:"expiresAt" bson:"expiresAt"`
	}

	SessionManager interface {
		SetEmail(ctx context.Context, email string) error
	}

	SessionManagerImpl struct {
		DB  *mongo.Database
		Sid string
	}

	DBClient interface {
		CreateUser(ctx context.Context, user User) error
		FindUserByEmail(ctx context.Context, email string) (*User, error)

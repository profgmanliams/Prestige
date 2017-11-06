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
		UpdateUser(ctx context.Context, filter bson.M, updates bson.M) (*mongo.UpdateResult, error)
		CreateSession(ctx context.Context, session SessionDTO) error
		UpdateSession(ctx context.Context, sid string, updates map[string]any) error
		FindSession(ctx context.Context, sid string) *SessionDTO
	}

	// Impl implements DBClient
	Impl struct {
		NativeDatabase *mongo.Database
	}
)

func New(ctx context.Context, dbUri string) DBClient {
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(dbUri))
	if err != nil {
		log.Panicf("Error connecting to MongoDB: %v", err)
	}

	dbName := regexp.MustCompile(`[^/]/(\w+)`).FindStringSubmatch(dbUri)[1]
	log.Printf("Opening database %q", dbName)

	database := client.Database(dbName)

	expireAfterSeconds := int32(0)
	mustCreateIndex(
		ctx,
		database.Collection("sessions"),
		"session_expire",
		bson.A{"expiresAt"},
		&options.IndexOptions{
			ExpireAfterSeconds: &expireAfterSeconds,
		},
	)

	mustCreateUniqueIndex(ctx, database.Collection("sessions"), "sid_unique", "sid")
	mustCreateUniqueIndex(ctx, database.Collection("users"), "email_unique", "email")

	return &Impl{
		NativeDatabase: database,
	}
}

func mustCreateUniqueIndex(ctx context.Context, collection *mongo.Collection, indexName string, key string) {
	t := true
	mustCreateIndex(ctx, collection, indexName, bson.A{key}, &options.IndexOptions{
		Unique: &t,
	})
}

func mustCreateIndex(

// Auto-generated SDK for Demo API v1.0.0
// Do not edit manually

package sdk

import (
  "bytes"
  "encoding/json"
  "fmt"
  "io"
  "net/http"
  "time"
)

const baseURL = "https://api.example.com/v1"

type Client struct {
  apiKey      string
  bearerToken string
  httpClient  *http.Client
}

func NewClient() *Client {
  return &Client{httpClient: &http.Client{Timeout: 30 * time.Second}}
}

func (c *Client) SetApiKey(key string) { c.apiKey = key }
func (c *Client) SetBearerToken(token string) { c.bearerToken = token }

func (c *Client) request(method, path string, body interface{}) (map[string]interface{}, error) {
  var reqBody io.Reader
  if body != nil {
    data, _ := json.Marshal(body)
    reqBody = bytes.NewBuffer(data)
  }
  req, err := http.NewRequest(method, baseURL+path, reqBody)
  if err != nil { return nil, err }
  req.Header.Set("Content-Type", "application/json")
  if c.apiKey != "" { req.Header.Set("X-API-Key", c.apiKey) }
  if c.bearerToken != "" { req.Header.Set("Authorization", "Bearer "+c.bearerToken) }
  res, err := c.httpClient.Do(req)
  if err != nil { return nil, err }
  defer res.Body.Close()
  if res.StatusCode >= 400 {
    return nil, fmt.Errorf("API Error: %d", res.StatusCode)
  }
  var result map[string]interface{}
  json.NewDecoder(res.Body).Decode(&result)
  return result, nil
}

// Get all users
func (c *Client) GetUsers() (map[string]interface{}, error) {
  return c.request("GET", "/users", nil)
}

// Create a new user
func (c *Client) CreateUser(body map[string]interface{}) (map[string]interface{}, error) {
  return c.request("POST", "/users", body)
}

// Get user by ID
func (c *Client) GetUserById(id string) (map[string]interface{}, error) {
  return c.request("GET", fmt.Sprintf("/users/%s", id), nil)
}

// Get all products
func (c *Client) GetProducts() (map[string]interface{}, error) {
  return c.request("GET", "/products", nil)
}

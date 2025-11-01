# Backend Flask app: models, routes, and SQLite DB configuration (todo.db)
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import (
    LoginManager,
    UserMixin,
    login_user,
    login_required,
    logout_user,
    current_user,
)
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# Create Flask app and enable CORS and password hashing

# App configuration: secret key (sessions) and SQLite DB location
app.config["SECRET_KEY"] = "your-secret-key"  # Change this to a secure secret key
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///todo.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize extensions: database (SQLAlchemy) and login manager
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)


# Database models
# User: app users with username/password
# TodoList: named list owned by a user
# TodoItem: tasks; supports hierarchy via parent_id and children relationship
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    lists = db.relationship("TodoList", backref="user", lazy=True)


class TodoList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    items = db.relationship("TodoItem", backref="todo_list", lazy=True)


class TodoItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(500), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    list_id = db.Column(db.Integer, db.ForeignKey("todo_list.id"), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey("todo_item.id"))
    is_expanded = db.Column(db.Boolean, default=True)
    children = db.relationship(
        "TodoItem", backref=db.backref("parent", remote_side=[id])
    )


@login_manager.user_loader
def load_user(user_id):
    # Load a user by id for session management
    return User.query.get(int(user_id))


# Routes (API endpoints)
@app.route("/api/register", methods=["POST"])
def register():
    # Register a new user
    data = request.get_json()
    hashed_password = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    new_user = User(username=data["username"], password=hashed_password)
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User created successfully"}), 201
    except:
        return jsonify({"error": "Username already exists"}), 400


@app.route("/api/login", methods=["POST"])
def login():
    # Login: check credentials and start a session
    data = request.get_json()
    user = User.query.filter_by(username=data["username"]).first()
    if user and bcrypt.check_password_hash(user.password, data["password"]):
        login_user(user)
        return jsonify({"message": "Logged in successfully"})
    return jsonify({"error": "Invalid username or password"}), 401


@app.route("/api/lists", methods=["GET", "POST"])
@login_required
def handle_lists():
    # GET: return lists owned by the logged-in user
    # POST: create a new list for the current user
    if request.method == "GET":
        lists = TodoList.query.filter_by(user_id=current_user.id).all()
        return jsonify([{"id": lst.id, "title": lst.title} for lst in lists])
    else:
        data = request.get_json()
        new_list = TodoList(title=data["title"], user_id=current_user.id)
        db.session.add(new_list)
        db.session.commit()
        return jsonify({"id": new_list.id, "title": new_list.title}), 201


@app.route("/api/lists/<int:list_id>/items", methods=["GET", "POST"])
@login_required
def handle_items(list_id):
    # Ensure the list exists and belongs to the current user
    todo_list = TodoList.query.filter_by(id=list_id, user_id=current_user.id).first()
    if not todo_list:
        return jsonify({"error": "List not found"}), 404

    # GET: return top-level items (parent_id is None) and include nested children
    # POST: create a new item in this list (can include parent_id to make it a sub-item)
    if request.method == "GET":
        items = TodoItem.query.filter_by(list_id=list_id, parent_id=None).all()
        return jsonify(
            [
                {
                    "id": item.id,
                    "content": item.content,
                    "completed": item.completed,
                    "is_expanded": item.is_expanded,
                    "children": get_children(item),
                }
                for item in items
            ]
        )
    else:
        data = request.get_json()
        new_item = TodoItem(
            content=data["content"], list_id=list_id, parent_id=data.get("parent_id")
        )
        db.session.add(new_item)
        db.session.commit()
        return (
            jsonify(
                {
                    "id": new_item.id,
                    "content": new_item.content,
                    "completed": new_item.completed,
                    "is_expanded": new_item.is_expanded,
                }
            ),
            201,
        )


def get_children(item):
    # Build a nested list of children recursively for JSON responses
    return [
        {
            "id": child.id,
            "content": child.content,
            "completed": child.completed,
            "is_expanded": child.is_expanded,
            "children": get_children(child),
        }
        for child in item.children
    ]


@app.route("/api/items/<int:item_id>", methods=["PUT", "DELETE"])
@login_required
def handle_item(item_id):
    item = (
        TodoItem.query.join(TodoList)
        .filter(TodoItem.id == item_id, TodoList.user_id == current_user.id)
        .first()
    )

    # Item must exist and belong to a list owned by the user
    if not item:
        return jsonify({"error": "Item not found"}), 404

    # PUT: update fields on the item (content, completed, is_expanded, list_id, parent_id)
    if request.method == "PUT":
        data = request.get_json()
        if "content" in data:
            item.content = data["content"]
        if "completed" in data:
            item.completed = data["completed"]
        if "is_expanded" in data:
            item.is_expanded = data["is_expanded"]
        if "list_id" in data:
            # Verify the target list belongs to the current user
            target_list = TodoList.query.filter_by(
                id=data["list_id"], user_id=current_user.id
            ).first()
            if not target_list:
                return jsonify({"error": "Target list not found"}), 404
            item.list_id = data["list_id"]
        if "parent_id" in data:
            # Allow setting parent_id to None (making it top-level) or to another item's ID
            if data["parent_id"] is None:
                item.parent_id = None
            else:
                # Verify the parent item exists and belongs to the same user
                parent_item = (
                    TodoItem.query.join(TodoList)
                    .filter(
                        TodoItem.id == data["parent_id"],
                        TodoList.user_id == current_user.id,
                    )
                    .first()
                )
                if not parent_item:
                    return jsonify({"error": "Parent item not found"}), 404
                # Prevent making item its own parent or creating circular references
                if parent_item.id == item.id:
                    return jsonify({"error": "Cannot make item its own parent"}), 400
                # Check for circular reference (parent is a descendant of this item)
                current = parent_item
                while current and current.parent_id:
                    if current.parent_id == item.id:
                        return (
                            jsonify({"error": "Cannot create circular reference"}),
                            400,
                        )
                    current = TodoItem.query.get(current.parent_id)
                item.parent_id = data["parent_id"]
        # Save updates to the item
        db.session.commit()
        return jsonify({"message": "Item updated successfully"})
    else:
        # DELETE: remove item and commit
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Item deleted successfully"})


if __name__ == "__main__":
    # On startup, create tables (if missing) and run the dev server
    with app.app_context():
        db.create_all()
    app.run(debug=True)

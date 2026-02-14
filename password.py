# from cryptography.fernet import Fernet
#
# # Generate a key (store this securely!)
# key = Fernet.generate_key()
# cipher = Fernet(key)
#
# print("key:",key)
# # Encrypt the password
# password = "pbkdf2:sha256:600000$LaA8ew3Mp38PgESu$e31eb9175d5c1889d346341b92dff20ab3b542ce448b435bfd85d23eea4c302a"
# encrypted_password = cipher.encrypt(password.encode())
#
# print("Encrypted:", encrypted_password)
#
# # Decrypt the password
# decrypted_password = cipher.decrypt(encrypted_password).decode()
#
# print("Decrypted:", decrypted_password)


# from werkzeug.security import check_password_hash
#
# stored_hash = "pbkdf2:sha256:600000$LaA8ew3Mp38PgESu$e31eb9175d5c1889d346341b92dff20ab3b542ce448b435bfd85d23eea4c302a"
#
# # The password the user enters
# input_password = "Dipankar"
#
# # Check if it matches
# if check_password_hash(stored_hash, input_password):
#     print("Password is correct")
# else:
#     print("Password is incorrect")


# from cryptography.fernet import Fernet
#
# key = Fernet.generate_key()
# with open("secret.key", "wb") as key_file:
#     key_file.write(key)

# from cryptography.fernet import Fernet
#
# # Load the saved key
# with open("secret.key", "rb") as key_file:
#     key = key_file.read()
#
# cipher = Fernet(key)
#
# password = "pbkdf2:sha256:600000$LaA8ew3Mp38PgESu$e31eb9175d5c1889d346341b92dff20ab3b542ce448b435bfd85d23eea4c302a"
# encrypted_password = cipher.encrypt(password.encode())
#
# print("Encrypted:", encrypted_password.decode())


# from cryptography.fernet import Fernet
#
# # Load the key
# with open("secret.key", "rb") as key_file:
#     key = key_file.read()
#
# cipher = Fernet(key)
#
# # Assume this came from your database
# encrypted_password = b"gAAAAABoc0GqzQ8b70lqhoUEcZysrz-jkbmrU5nR3HrNQspU4iMDSTmvVTxIF42N5Fj7ydlOVwglau86Q_CWlt1FnhVvdHx3Q_h1A1USk6fOjQi5b4_uoVbFSuwYBOy5wAow_qNJhK83pxa7EXoE1BRpaOGuS5Qcjd6JPiVcn2HbfSc12xuvRMcaA3ihgABa9YH7xs5XwBWCiz95yZZx-d3oqrw2cvtluA=="
#
# decrypted_password = cipher.decrypt(encrypted_password).decode()
# print("Decrypted:", decrypted_password)
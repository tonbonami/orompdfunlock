from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pikepdf
import zipfile
import io
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/unlock-pdfs")
async def unlock_pdfs(
    files: list[UploadFile] = File(...),
    password: str = Form(default="")
):
    results = []
    unlocked_files = {}

    for file in files:
        content = await file.read()
        pdf_stream = io.BytesIO(content)

        is_encrypted = False
        try:
            pdf_check = pikepdf.open(pdf_stream)
            pdf_check.close()
            is_encrypted = False
        except pikepdf.PasswordError:
            is_encrypted = True
        except Exception:
            is_encrypted = True

        pdf_stream.seek(0)

        if not is_encrypted:
            try:
                pdf = pikepdf.open(pdf_stream)
                output = io.BytesIO()
                pdf.save(output, encryption=False)
                output.seek(0)
                unlocked_files[file.filename] = output.read()
                results.append({"filename": file.filename, "status": "already_unlocked"})
            except Exception as e:
                results.append({"filename": file.filename, "status": "failed", "message": str(e)})
            continue

        pdf_stream.seek(0)
        try:
            pdf = pikepdf.open(pdf_stream, password=password, allow_overwriting_input=False)
            output = io.BytesIO()
            pdf.save(output, encryption=False)
            output.seek(0)
            unlocked_data = output.read()

            verify_stream = io.BytesIO(unlocked_data)
            try:
                pikepdf.open(verify_stream)
                unlocked_files[file.filename] = unlocked_data
                results.append({"filename": file.filename, "status": "unlocked"})
            except Exception:
                results.append({"filename": file.filename, "status": "verification_failed"})

        except pikepdf.PasswordError:
            results.append({"filename": file.filename, "status": "wrong_password"})
        except Exception as e:
            results.append({"filename": file.filename, "status": "failed", "message": str(e)})

    if unlocked_files:
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for filename, data in unlocked_files.items():
                zf.writestr(f"unlocked_{filename}", data)
        zip_buffer.seek(0)

        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": "attachment; filename=unlocked_pdfs.zip",
                "X-Unlock-Results": json.dumps(results, ensure_ascii=False),
                "Access-Control-Expose-Headers": "X-Unlock-Results",
            }
        )

    return JSONResponse(content={"results": results}, status_code=400)

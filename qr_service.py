from pathlib import Path

import qrcode


# Folder where generated QR images will be stored
QR_FOLDER = Path("generated_qr_codes")

QR_FOLDER.mkdir(
    parents=True,
    exist_ok=True
)


def generate_qr_code(ticket_code: str) -> str:
    """
    Generate a high-quality QR code image for a ticket.

    The QR code contains the unique ticket code.
    """

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=15,
        border=6,
    )

    qr.add_data(ticket_code)
    qr.make(fit=True)

    qr_image = qr.make_image(
        fill_color="black",
        back_color="white",
    )

    file_name = f"{ticket_code}.png"
    file_path = QR_FOLDER / file_name

    qr_image.save(
        file_path,
        format="PNG",
    )

    return str(file_path)
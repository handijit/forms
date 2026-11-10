import { expect, test, type Page } from "@playwright/test";

const OUT = "e2e/out";

const open = async (page: Page, theme: "light" | "dark"): Promise<void> => {
  await page.goto(`/?theme=${theme}`);
  await expect(
    page.getByRole("heading", { name: "Hesap oluştur" })
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

const activeLabel = (page: Page): Promise<string | null> =>
  page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active === null || active.id === "") return null;
    return (
      document.querySelector(`label[for="${active.id}"]`)?.textContent ?? null
    );
  });

for (const theme of ["light", "dark"] as const) {
  test.describe(`the sample form, ${theme} theme`, () => {
    test("should show every error after an empty submit and focus the first field", async ({
      page,
    }) => {
      await open(page, theme);
      await page.screenshot({
        path: `${OUT}/${theme}-1-empty.png`,
        fullPage: true,
      });

      // Keyboard only: into the first field, Enter submits the form.
      await page.keyboard.press("Tab");
      expect(await activeLabel(page)).toContain("Ad soyad");
      await page.keyboard.press("Enter");

      const name = page.getByLabel("Ad soyad");
      await expect(name).toBeFocused();
      await expect(name).toHaveAttribute("aria-invalid", "true");
      await expect(
        page.getByText("Adınızı yazın", { exact: true })
      ).toBeVisible();
      await expect(
        page.getByText("Lütfen işaretli alanları düzeltin.")
      ).toBeVisible();
      await expect(
        page.getByRole("link", {
          name: "E-posta: Geçerli bir e-posta adresi yazın",
        })
      ).toBeVisible();
      await page.screenshot({
        path: `${OUT}/${theme}-2-errors.png`,
        fullPage: true,
      });
      // The whole field with room around it, so ui's focus ring (outside the box) shows.
      const box = await name.boundingBox();
      if (box === null) throw new Error("the name field has no box");
      await page.screenshot({
        path: `${OUT}/${theme}-3-focused-invalid-field.png`,
        clip: {
          x: box.x - 16,
          y: box.y - 40,
          width: box.width + 32,
          height: box.height + 76,
        },
      });
    });

    test("should fix errors by keyboard, keep the caret in masks and submit", async ({
      page,
    }) => {
      await open(page, theme);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await expect(page.getByLabel("Ad soyad")).toBeFocused();

      await page.keyboard.type("Ada Lovelace");
      // The error goes while the user fixes the field.
      await expect(
        page.getByText("Adınızı yazın", { exact: true })
      ).toHaveCount(0);
      await page.keyboard.press("Tab");
      await page.keyboard.type("kayitli@handijit.com");
      await page.keyboard.press("Tab");
      await page.keyboard.type("5321234567");
      await expect(page.getByLabel("Telefon")).toHaveValue("532 123 45 67");
      await page.keyboard.press("Tab");
      await expect(page.getByLabel("Telefon")).toHaveValue("0532 123 45 67");
      await page.keyboard.type("10000000146");
      await page.keyboard.press("Tab");
      await page.keyboard.type("12");

      // The select by keyboard: open, move, choose.
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await page.getByRole("option", { name: "Ankara" }).click();

      await page.getByRole("radio", { name: "Yıllık" }).check();
      await page
        .getByRole("textbox", { name: "Şifre (zorunlu)", exact: true })
        .fill("gizli-sifre");
      await page.getByLabel("Şifre (tekrar)").fill("baska-sifre");
      await page
        .getByRole("checkbox", { name: "Kullanım koşullarını kabul ediyorum" })
        .focus();
      await page.keyboard.press("Space");
      await page.getByRole("button", { name: "Hesap oluştur" }).click();

      // The cross-field rule lands on the confirmation field.
      const confirm = page.getByLabel("Şifre (tekrar)");
      await expect(confirm).toBeFocused();
      await expect(
        page.getByText("Şifreler eşleşmiyor", { exact: true })
      ).toBeVisible();
      await confirm.fill("gizli-sifre");

      // The server rejects the address: the error lands on the field and takes the focus.
      await page.getByRole("button", { name: "Hesap oluştur" }).click();
      const email = page.getByLabel("E-posta");
      await expect(email).toBeFocused();
      await expect(
        page.getByText("Bu e-posta adresiyle bir hesap var.", { exact: true })
      ).toBeVisible();
      await page.screenshot({
        path: `${OUT}/${theme}-4-server-error.png`,
        fullPage: true,
      });

      await email.fill("ada@handijit.com");
      await page.getByRole("button", { name: "Hesap oluştur" }).click();
      await expect(page.getByTestId("status")).toHaveText(
        "Kaydedildi: Ada Lovelace"
      );
      await page.screenshot({
        path: `${OUT}/${theme}-5-saved.png`,
        fullPage: true,
      });
    });
  });
}

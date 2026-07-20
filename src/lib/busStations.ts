// Real, well-known inter-provincial bus stations in Vietnam, keyed by the
// same 2-digit province code the app already stores on Route documents
// (origin_province / destination_province — Vietnam's official GSO codes).
//
// This is a curated convenience list, not an exhaustive directory — it
// exists so a partner creating a pickup/dropoff point can quick-fill a real
// station for the route's actual province instead of typing free text (or
// worse, picking a station from a completely different city). The Stop
// Name/Address inputs stay fully editable either way, so anything not in
// this list can still be entered manually.

export interface BusStation {
  name: string
  address: string
}

export const BUS_STATIONS_BY_PROVINCE: Record<string, BusStation[]> = {
  // Hà Nội
  '01': [
    { name: 'Bến xe Mỹ Đình', address: 'Phạm Hùng, Nam Từ Liêm, Hà Nội' },
    { name: 'Bến xe Giáp Bát', address: 'Giải Phóng, Hoàng Mai, Hà Nội' },
    { name: 'Bến xe Nước Ngầm', address: 'Ngọc Hồi, Hoàng Mai, Hà Nội' },
    { name: 'Bến xe Yên Nghĩa', address: 'Quang Trung, Hà Đông, Hà Nội' },
    { name: 'Bến xe Gia Lâm', address: 'Ngô Gia Khảm, Long Biên, Hà Nội' },
  ],
  // Lào Cai
  '10': [
    { name: 'Bến xe Lào Cai', address: 'TP. Lào Cai, Lào Cai' },
    { name: 'Bến xe Sa Pa', address: 'Sa Pa, Lào Cai' },
  ],
  // Quảng Ninh
  '22': [
    { name: 'Bến xe Bãi Cháy', address: 'Hạ Long, Quảng Ninh' },
    { name: 'Bến xe Cái Rồng', address: 'Vân Đồn, Quảng Ninh' },
    { name: 'Bến xe Móng Cái', address: 'Móng Cái, Quảng Ninh' },
  ],
  // Hải Phòng
  '31': [
    { name: 'Bến xe Niệm Nghĩa', address: 'Lê Lợi, Hải Phòng' },
    { name: 'Bến xe Tam Bạc', address: 'Hồng Bàng, Hải Phòng' },
    { name: 'Bến xe Cầu Rào', address: 'Ngô Quyền, Hải Phòng' },
  ],
  // Nam Định
  '36': [
    { name: 'Bến xe Nam Định', address: 'TP. Nam Định, Nam Định' },
  ],
  // Ninh Bình
  '37': [
    { name: 'Bến xe Ninh Bình', address: 'Lê Đại Hành, Ninh Bình' },
  ],
  // Thừa Thiên Huế
  '46': [
    { name: 'Bến xe phía Nam Huế', address: 'An Cựu, TP. Huế, Thừa Thiên Huế' },
  ],
  // Đà Nẵng
  '48': [
    { name: 'Bến xe Trung tâm Đà Nẵng', address: 'Tôn Đức Thắng, Liên Chiểu, Đà Nẵng' },
  ],
  // Quảng Ngãi
  '51': [
    { name: 'Bến xe Quảng Ngãi', address: 'TP. Quảng Ngãi, Quảng Ngãi' },
  ],
  // Bình Định
  '52': [
    { name: 'Bến xe Trung tâm Quy Nhơn', address: 'Quy Nhơn, Bình Định' },
  ],
  // Khánh Hòa
  '56': [
    { name: 'Bến xe phía Nam Nha Trang', address: 'Nha Trang, Khánh Hòa' },
  ],
  // Lâm Đồng
  '68': [
    { name: 'Bến xe Đà Lạt', address: 'Tô Hiến Thành, Đà Lạt, Lâm Đồng' },
  ],
  // TP. Hồ Chí Minh
  '79': [
    { name: 'Bến xe Miền Đông', address: 'Xa lộ Hà Nội, TP. Thủ Đức, TP. Hồ Chí Minh' },
    { name: 'Bến xe Miền Tây', address: 'Kinh Dương Vương, Bình Tân, TP. Hồ Chí Minh' },
    { name: 'Bến xe An Sương', address: 'Quốc lộ 22, Hóc Môn, TP. Hồ Chí Minh' },
  ],
  // Cần Thơ
  '92': [
    { name: 'Bến xe Trung tâm Cần Thơ', address: 'Ninh Kiều, Cần Thơ' },
    { name: 'Bến xe 91B', address: 'Ninh Kiều, Cần Thơ' },
  ],
}

export const getStationsForProvince = (provinceCode?: string): BusStation[] =>
  (provinceCode && BUS_STATIONS_BY_PROVINCE[provinceCode]) || []

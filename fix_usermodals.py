import re

with open("components/admin/users/UserModals.tsx", "r") as f:
    content = f.read()

old_ttl = """                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">TTL</span>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {user.tempat_lahir ? `${user.tempat_lahir}, ` : ''}
                      {user.tanggal_lahir ? new Date(user.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </span>
                  </div>"""

new_ttl = """                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">TTL</span>
                    <span className="text-sm font-medium text-gray-900 leading-tight">
                      {user.tempat_lahir ? `${user.tempat_lahir}, ` : ''}
                      {user.tanggal_lahir ? new Date(user.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </span>
                  </div>"""

content = content.replace(old_ttl, new_ttl)

with open("components/admin/users/UserModals.tsx", "w") as f:
    f.write(content)
